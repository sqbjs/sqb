import {Constructor, FindOptions} from './types';
import {EntityDefinition} from './definition/EntityDefinition';
import {
    ColumnDefinition,
    isDataColumn,
    isRelationColumn,
    RelationColumnDefinition
} from './definition/ColumnDefinition';
import {And, Eq, LeftOuterJoin, Operator, Or, Raw, Select} from '@sqb/builder';
import {Maybe} from '../types';
import {getEntityDefinition} from './helpers';
import {FieldInfo, QueryExecutor} from '../client/types';

const SORT_ORDER_PATTERN = /^([-+])?(.*)$/;

interface Context {
    entityDef: EntityDefinition;
    tableAlias: string;
    queryColumns: ColumnInfo[];
    parentPath: string;
    joins?: JoinInfo[];
}

interface ColumnInfo {
    name: string;
    entity: EntityDefinition;
    column: ColumnDefinition;
    tableAlias: string;
    alias: string;
    sqlClause: string;
    path?: string[];
    eagerTask?: FindTask<any>;
}

interface JoinInfo {
    relation: RelationColumnDefinition;
    targetEntity: EntityDefinition;
    tableAlias: string;
    condition: Operator[]
}

export class FindTask<T> implements FindOptions {
    entityDef: EntityDefinition;
    columns?: string[];
    filter?: Operator[];
    sort?: string[];
    offset?: number;
    limit?: number;

    constructor(public executor: QueryExecutor,
                public ctor: Constructor,
                options: FindOptions) {
        this.entityDef = getEntityDefinition(ctor);
        this.columns = options.columns;
        this.filter = options.filter;
        this.sort = options.sort;
        this.offset = options.offset;
        this.limit = options.limit;
    }

    async execute(): Promise<T[]> {
        const ctx: Context = {
            entityDef: this.entityDef,
            tableAlias: 'T',
            queryColumns: [],
            parentPath: ''
        }
        await this._prepare(ctx);
        const {queryColumns} = ctx;

        const columnSqls = queryColumns.reduce<string[]>((a, x) => {
            if (x.sqlClause)
                a.push(x.sqlClause);
            return a;
        }, []);

        const query = Select(...columnSqls).from(this.entityDef.tableName + ' T');

        if (ctx.joins) {
            for (const j of ctx.joins) {
                query.join(
                    LeftOuterJoin(j.targetEntity.tableName + ' as ' + j.tableAlias)
                        .on(...j.condition)
                )
            }
        }
        if (this.filter)
            query.where(...this.filter);
        if (this.offset)
            query.offset(this.offset);
        const orderColumns = this._prepareSort();
        if (orderColumns)
            query.orderBy(...orderColumns);

        // Execute query
        const resp = await this.executor.execute(query, {
            fetchRows: this.limit,
            objectRows: false,
            cursor: false
        });

        if (resp.rows && resp.fields) {
            const fields = resp.fields;
            const srcRows = resp.rows as any[][];
            const rows: T[] = [];
            const rowLen = srcRows.length;
            const colLen = queryColumns.length;

            // Create rows
            let cinfo: ColumnInfo;
            let o: any;
            let f: FieldInfo;
            for (let rowIdx = 0; rowIdx < rowLen; rowIdx++) {
                const src = srcRows[rowIdx] as any[];
                const trg = {};
                for (let colIdx = 0; colIdx < colLen; colIdx++) {
                    cinfo = queryColumns[colIdx];
                    if (!cinfo.alias)
                        continue;
                    f = fields.get(cinfo.alias);
                    if (!f)
                        continue;
                    o = trg;
                    // One2One relation columns has path property
                    // We iterate over path to create sub objects to write value in
                    if (cinfo.path) {
                        for (const p of cinfo.path) {
                            o = o[p] = (o[p] || {});
                        }
                    }
                    o[cinfo.name] = src[f.index];
                }
                Object.setPrototypeOf(trg, this.ctor.prototype);
                rows.push(trg as T);
            }
            // Fetch eager relations
            for (let colIdx = 0; colIdx < colLen; colIdx++) {
                cinfo = queryColumns[colIdx];
                if (isRelationColumn(cinfo.column) && cinfo.eagerTask) {
                    const pks: Operator[] = [];
                    for (let i = 0; i < rows.length; i++) {
                        if (cinfo.column.column.length > 1) {
                            const or = pks[i] = And();
                            for (const x of cinfo.column.column) {
                                or.add(Eq(x, rows[i][x]));
                            }
                        } else pks[i] = Eq(cinfo.column.column[0], rows[i][cinfo.column.column[0]])
                    }
                    if (pks.length)
                        continue;
                    cinfo.eagerTask.filter =
                        pks.length > 1 ? [Or(...pks)] : pks;
                }
            }
            return rows;
        }
        return [];
    }

    private async _prepare(ctx: Context): Promise<void> {
        const requestedColumns = this.columns ?
            this.columns.map(x => x.toUpperCase()) : undefined;
        const parentPathUpper = ctx.parentPath.toUpperCase();
        const pathDot = parentPathUpper ? parentPathUpper + '.' : '';
        const {queryColumns} = ctx;

        for (const col of ctx.entityDef.columns.values()) {
            const colName = col.name.toUpperCase();
            const alias = ctx.tableAlias + '_' + colName;

            if (isDataColumn(col)) {
                if (requestedColumns && !requestedColumns.find(
                    x => x === pathDot + colName || x === parentPathUpper))
                    continue;
                queryColumns.push({
                    name: col.name,
                    entity: ctx.entityDef,
                    column: col,
                    tableAlias: ctx.tableAlias,
                    alias,
                    path: ctx.parentPath ? ctx.parentPath.split('.') : undefined,
                    sqlClause: `${ctx.tableAlias}.${col.fieldName} as ${alias}`
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
                    ctx.joins = ctx.joins || [];
                    // Create the join statement
                    let join = ctx.joins.find(j => j.relation === col);
                    if (!join) {
                        const jointAlias = 'J' + (ctx.joins.length + 1);
                        join = {
                            relation: col,
                            targetEntity,
                            tableAlias: jointAlias,
                            condition: []
                        }
                        for (let i = 0; i < col.column.length; i++) {
                            const curCol = ctx.entityDef.getDataColumn(col.column[i]);
                            if (!curCol)
                                throw new Error(`Relation column "${col.name}" definition error. ` +
                                    ` ${ctx.entityDef.name} has no column "${col.column[i]}"`);
                            const targetCol = targetEntity.getDataColumn(col.targetColumn[i]);
                            if (!targetCol)
                                throw new Error(`Relation column "${col.name}" definition error. ` +
                                    `${targetEntity.name} has no column "${col.targetColumn[i]}"`);
                            join.condition.push(
                                Eq(jointAlias + '.' + targetCol.fieldName, Raw(ctx.tableAlias + '.' + curCol.fieldName))
                            )
                        }
                        ctx.joins.push(join);
                    }
                    await this._prepare({
                        ...ctx,
                        entityDef: join.targetEntity,
                        tableAlias: join.tableAlias,
                        parentPath: (ctx.parentPath ? ctx.parentPath + '.' : '') + col.name
                    });
                    continue;
                }

                if (col.lazy) {
                    queryColumns.push({
                        name: col.name,
                        entity: ctx.entityDef,
                        column: col,
                        path: ctx.parentPath ? ctx.parentPath.split('.') : undefined,
                        tableAlias: '',
                        alias: '',
                        sqlClause: ''
                    });
                    continue;
                }

                // Eager relation
                const eagerTask = new FindTask(this.executor, ctx.entityDef.ctor,
                    {columns: this.columns});
                queryColumns.push({
                    name: col.name,
                    entity: ctx.entityDef,
                    column: col,
                    path: ctx.parentPath ? ctx.parentPath.split('.') : undefined,
                    tableAlias: '',
                    alias: '',
                    sqlClause: '',
                    eagerTask
                });

            }
        }
    }

    private _prepareSort(): Maybe<string[]> {
        if (!this.sort)
            return;
        const orderColumns: string[] = [];
        for (const item of this.sort) {
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
