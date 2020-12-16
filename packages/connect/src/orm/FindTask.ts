import {Constructor, FindOptions} from './types';
import {EntityDefinition} from './definition/EntityDefinition';
import {
    ColumnDefinition,
    isDataColumn,
    isRelationColumn,
    RelationColumnDefinition
} from './definition/ColumnDefinition';
import {Eq, LeftOuterJoin, Operator, Raw, Select} from '@sqb/builder';
import {Maybe} from '../types';
import {getEntityDefinition} from './helpers';
import {QueryExecutor} from '../client/types';

const SORT_ORDER_PATTERN = /^([-+])?(.*)$/;

interface ColumnInfo {
    name: string;
    entity: EntityDefinition;
    column: ColumnDefinition;
    tableAlias: string;
    alias: string;
    sqlClause: string;
    path?: string[];
}

interface JoinInfo {
    relation: RelationColumnDefinition;
    targetEntity: EntityDefinition;
    tableAlias: string;
    condition: Operator[]
}

export class FindTask<T> {
    entityDef: EntityDefinition;
    requestedColumns?: string[];
    queryColumns: ColumnInfo[] = [];
    joins?: JoinInfo[];

    constructor(public executor: QueryExecutor, public ctor: Constructor, public options: FindOptions) {
        this.entityDef = getEntityDefinition(ctor);
        if (options.columns)
            this.requestedColumns = options.columns.map(x => x.toUpperCase());
    }

    async execute(): Promise<T[]> {
        await this._precessColumns(this.entityDef, 'T',
            this.queryColumns);

        const queryColumns = this.queryColumns;
        const columnSqls = queryColumns.map(x => x.sqlClause);
        const query = Select(...columnSqls).from(this.entityDef.tableName + ' T');
        if (this.joins) {
            for (const j of this.joins) {
                query.join(
                    LeftOuterJoin(j.targetEntity.tableName + ' as ' + j.tableAlias)
                        .on(...j.condition)
                )
            }
        }
        if (this.options.filter)
            query.where(...this.options.filter);
        if (this.options.offset)
            query.offset(this.options.offset);
        const orderColumns = this._prepareSort();
        if (orderColumns)
            query.orderBy(...orderColumns);

        // Execute query
        const resp = await this.executor.execute(query, {
            fetchRows: this.options.limit,
            objectRows: true,
            cursor: false,
            ignoreNulls: false,
            namingStrategy: 'uppercase'
        });

        if (resp.rows) {
            const srcRows = resp.rows;
            const rows: T[] = [];
            const rowLen = srcRows.length;
            const colLen = queryColumns.length;

            let cinfo: ColumnInfo;
            let o: any;
            for (let rowIdx = 0; rowIdx < rowLen; rowIdx++) {
                const src = srcRows[rowIdx];
                const row = {};
                for (let colIdx = 0; colIdx < colLen; colIdx++) {
                    cinfo = queryColumns[colIdx];
                    o = row;
                    // One2One relation columns has path property
                    // We iterate over path to create sub objects to write value in
                    if (cinfo.path) {
                        for (const p of cinfo.path) {
                            o = o[p] = (o[p] || {});
                        }
                    }
                    o[cinfo.name] = src[cinfo.alias];
                }
                Object.setPrototypeOf(row, this.ctor.prototype);
                rows.push(row as T);
            }
            return rows;
        }
        return [];
    }

    private async _precessColumns(entityDef: EntityDefinition,
                                  tableAlias: string,
                                  queryColumns: ColumnInfo[],
                                  parentPath = ''): Promise<void> {
        const pathDot = parentPath.toUpperCase() + (parentPath ? '.' : '');
        const requestedColumns = this.requestedColumns;
        // const opts = this.options;
        for (const col of entityDef.columns.values()) {
            const colName = col.name.toUpperCase();
            const alias = tableAlias + '_' + colName;
            if (isDataColumn(col)) {
                if (requestedColumns && !requestedColumns.find(
                    x => x === pathDot + colName || x === parentPath.toUpperCase()))
                    continue;
                this.queryColumns.push({
                    name: col.name,
                    entity: entityDef,
                    column: col,
                    tableAlias,
                    alias,
                    path: parentPath ? parentPath.split('.') : undefined,
                    sqlClause: `${tableAlias}.${col.fieldName} as ${alias}`
                });
                continue;
            }
            if (isRelationColumn(col)) {
                // Relational columns must be explicitly requested.
                if (!(requestedColumns && requestedColumns.find(x =>
                    x === pathDot + colName || x.startsWith(pathDot + colName + '.')
                )))
                    continue;
                const targetEntity = await col.resolveTarget();
                if (!targetEntity)
                    throw new Error(`Relation column "${col.name}" definition error. ` +
                        `No valid target entity defined.`);
                // If relation is One2One
                if (!col.hasMany) {
                    this.joins = this.joins || [];
                    // Create the join statement
                    let join = this.joins.find(j => j.relation === col);
                    if (!join) {
                        const jointAlias = 'J' + (this.joins.length + 1);
                        join = {
                            relation: col,
                            targetEntity,
                            tableAlias: jointAlias,
                            condition: []
                        }
                        for (let i = 0; i < col.column.length; i++) {
                            const curCol = entityDef.getDataColumn(col.column[i]);
                            if (!curCol)
                                throw new Error(`Relation column "${col.name}" definition error. ` +
                                    ` ${entityDef.name} has no column "${col.column[i]}"`);
                            const targetCol = targetEntity.getDataColumn(col.targetColumn[i]);
                            if (!targetCol)
                                throw new Error(`Relation column "${col.name}" definition error. ` +
                                    `${targetEntity.name} has no column "${col.targetColumn[i]}"`);
                            join.condition.push(
                                Eq(jointAlias + '.' + targetCol.fieldName, Raw(tableAlias + '.' + curCol.fieldName))
                            )
                        }
                        this.joins.push(join);
                    }
                    await this._precessColumns(join.targetEntity, join.tableAlias, queryColumns,
                        (parentPath ? parentPath + '.' : '') + col.name);
                }
            }
        }
    }

    private _prepareSort(): Maybe<string[]> {
        if (!this.options.sort)
            return;
        const orderColumns: string[] = [];
        for (const item of this.options.sort) {
            const m = item.match(SORT_ORDER_PATTERN);
            if (!m)
                throw new Error(`"${item}" is not a valid order expression`);
            const colName = m[2];
            const col = this.entityDef.getColumn(colName);
            if (!col)
                throw new Error(`Unknown column (${colName}) declared in sort property`);
            if (!isDataColumn(col))
                throw new Error(`Can not sort by "${colName}", because it is not a data column`);
            const dir = m[1];
            if ((!dir || dir === '+') && !col.sortAscending)
                throw new Error(`Ascending sort on olumn "${colName}" is not allowed`);
            if ((!dir || dir === '-') && !col.sortDescending)
                throw new Error(`Descending sort on olumn "${colName}" is not allowed`);
            orderColumns.push((dir || '') + col.fieldName);
        }
        return orderColumns;
    }

}
