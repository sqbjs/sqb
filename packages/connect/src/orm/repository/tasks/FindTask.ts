import type {LogicalOperator} from '@sqb/builder';
import {
    And, Eq, Exists, In, isCompOperator,
    isLogicalOperator, LeftOuterJoin, Param, Raw, Select
} from '@sqb/builder';
import type {Constructor, FindOptions, LazyResolver} from '../../orm.types';
import type {EntityDefinition} from '../../model/EntityDefinition';
import type {
    ColumnDefinition,
    DataColumnDefinition,
    RelationColumnDefinition
} from '../../model/ColumnDefinition';
import {getEntityDefinition} from '../../helpers';
import {isDataColumn, isRelationColumn} from '../../model/ColumnDefinition';
import type {FieldInfo, QueryExecutor} from '../../../client/types';

const SORT_ORDER_PATTERN = /^([-+])?(.*)$/;

interface ColumnInfo {
    column: ColumnDefinition;
    name: string;
    entity: EntityDefinition;
    tableAlias: string;
    alias: string;
    sqlClause: string;
    path?: string[];
    pathEntities?: EntityDefinition[];
    visible: boolean,
    subTask?: FindTask<any>;
    subTaskOptions?: FindOptions;
    subTaskAliases?: string[];
    eagerParams?: Record<string, any[]>;
}

interface JoinInfo {
    relation: RelationColumnDefinition;
    targetEntity: EntityDefinition;
    tableAlias: string;
    condition: any[];
}

export class FindTask<T> {
    entityDef: EntityDefinition;

    constructor(public executor: QueryExecutor,
                public ctor: Constructor) {
        this.entityDef = getEntityDefinition(ctor);
    }

    async execute(options?: FindOptions): Promise<T[]> {
        return this._execute(options);
    }

    private async _execute(opts: FindOptions & { params?: any } = {}): Promise<T[]> {
        const queryColumns: ColumnInfo[] = [];
        const joins: JoinInfo[] = [];
        // Prepare filter must be executed first
        // Wrap search filter to operator instances
        let filter: LogicalOperator | undefined;
        if (opts.filter) {
            const srpOp = And();
            if (Array.isArray(opts.filter))
                srpOp.add(...opts.filter);
            else srpOp.add(opts.filter);
            filter = And();
            await this._processFilter(this.entityDef, srpOp, filter);
        }

        await this._processColumns({
            options: opts,
            queryColumns,
            joins,
            entityDef: this.entityDef,
            tableAlias: 'T'
        });

        const columnSqls = queryColumns.reduce<string[]>((a, x) => {
            if (x.sqlClause)
                a.push(x.sqlClause);
            return a;
        }, []);

        const query = Select(...columnSqls).from(this.entityDef.tableName + ' T');
        for (const j of joins) {
            query.join(
                LeftOuterJoin(j.targetEntity.tableName + ' as ' + j.tableAlias)
                    .on(...j.condition)
            )
        }
        if (filter)
            query.where(...filter._items);
        if (opts.offset)
            query.offset(opts.offset);
        if (opts.sort)
            query.orderBy(...this._prepareSort(opts.sort));

        // Execute query
        const resp = await this.executor.execute(query, {
            values: opts?.params,
            fetchRows: opts.limit,
            objectRows: false,
            cursor: false,
        });

        // Create rows
        if (resp.rows && resp.fields) {
            const fields = resp.fields;
            const srcRows = resp.rows as any[][];
            const rows: T[] = [];
            const rowLen = srcRows.length;
            const colLen = queryColumns.length;

            let cinfo: ColumnInfo;
            let o: any;
            let field: FieldInfo;
            // Iterate and convert rows to entity objects
            for (let rowIdx = 0; rowIdx < rowLen; rowIdx++) {
                const src = srcRows[rowIdx] as any[];
                const trg = {};
                for (let colIdx = 0; colIdx < colLen; colIdx++) {
                    cinfo = queryColumns[colIdx];

                    if (isRelationColumn(cinfo.column) && cinfo.subTask) {
                        if (cinfo.column.lazy) {
                            const subTask = cinfo.subTask as FindTask<any>;
                            const subOptions = cinfo.subTaskOptions as FindOptions;
                            const hasMany = cinfo.column.hasMany;
                            const params: any = {};
                            for (const alias of cinfo.subTaskAliases as string[]) {
                                const f = fields.get(alias);
                                params[alias] = f && src[f.index];
                            }
                            trg[cinfo.name] = (async (options?: FindOptions) => {
                                const _opts = {...subOptions, ...options, params};
                                // @ts-ignore
                                _opts.filter = [...subOptions.filter];
                                if (options && options.filter) {
                                    (_opts.filter as any[]).push(options.filter);
                                }
                                const r = await subTask._execute(_opts);
                                return hasMany ? r : r[0];
                            }) as LazyResolver<any>;

                        } else {
                            // Keep a list of key field/value pairs to fetch rows for eager relation
                            const params = cinfo.eagerParams = cinfo.eagerParams || {};
                            for (const alias of cinfo.subTaskAliases as string[]) {
                                const f = fields.get(alias);
                                const v = f && src[f.index];
                                if (v != null) {
                                    params[alias] = params[alias] || [];
                                    params[alias].push(v);
                                }
                            }
                        }
                        continue;
                    }

                    if (!(cinfo.alias && cinfo.visible))
                        continue;
                    field = fields.get(cinfo.alias);
                    if (!field)
                        continue;
                    o = trg;
                    // One2One relation columns has path property
                    // We iterate over path to create sub objects to write value in
                    if (cinfo.path) {
                        for (const [i, p] of cinfo.path.entries()) {
                            o = o[p] = (o[p] || {});
                            // @ts-ignore
                            Object.setPrototypeOf(o, (cinfo.pathEntities[i]).ctor.prototype);
                        }
                    }
                    o[cinfo.name] = src[field.index];
                }
                // Set object prototype to entities prototype
                Object.setPrototypeOf(trg, this.ctor.prototype);
                rows.push(trg as T);
            }

            // Fetch one-2-many related rows and merge with result rows
            for (let colIdx = 0; colIdx < colLen; colIdx++) {
                cinfo = queryColumns[colIdx];
                if (isRelationColumn(cinfo.column) && cinfo.subTask && !cinfo.column.lazy) {
                    const subTask = cinfo.subTask as FindTask<any>;
                    const subOptions = cinfo.subTaskOptions as FindOptions;
                    const _opts = {
                        ...subOptions,
                        params: cinfo.eagerParams,
                        limit: opts.maxEagerFetch || 100000
                    };
                    const subRows = new Set(await subTask._execute(_opts));
                    const keyCols = cinfo.column.getColumns()
                        .map(c => c.name);
                    const keyColsLen = keyCols.length;
                    const trgCols = (await cinfo.column.resolveTargetColumns())
                        .map(c => c.name);

                    // init array value for column
                    for (const row of rows) {
                        row[cinfo.name] = [];
                    }
                    // Merge rows
                    let matched = true;
                    const rowCount = rows.length;
                    let row;
                    for (let i = 0; i < rowCount; i++) {
                        row = rows[i];
                        for (const subRow of subRows) {
                            matched = true;
                            for (let n = 0; n < keyColsLen; n++) {
                                if (subRow[trgCols[n]] !== row[keyCols[n]]) {
                                    matched = false;
                                    break;
                                }
                                if (!matched)
                                    continue;
                                row[cinfo.name].push(subRow);
                                subRows.delete(subRow);
                            }
                        }
                    }
                }
            }
            return rows;
        }
        return [];
    }

    private async _processColumns(args: {
        options: FindOptions,
        queryColumns: ColumnInfo[];
        joins: JoinInfo[];
        entityDef: EntityDefinition;
        tableAlias: string;
        parentPath?: string[];
        pathEntities?: EntityDefinition[];
    }): Promise<void> {
        const {
            options,
            parentPath,
            entityDef,
            queryColumns,
            tableAlias,
            pathEntities,
            joins,
        } = args;
        const requestedColumns = options.columns ?
            options.columns.map(x => x.toUpperCase()) : undefined;
        const pPath = parentPath ? parentPath.join('.') : ''
        const pPathUpper = pPath.toUpperCase();
        const pPathDot = pPathUpper ? pPathUpper + '.' : '';

        for (const col of entityDef.columns.values()) {
            const colNameUpper = col.name.toUpperCase();

            if (isDataColumn(col)) {
                if (requestedColumns && !requestedColumns.find(
                    x => x === pPathDot + colNameUpper || x === pPathUpper))
                    continue;
                const cinfo = this._addDataColumn(queryColumns, col, tableAlias);
                cinfo.path = parentPath;
                cinfo.pathEntities = pathEntities;
                cinfo.visible = true;
                continue;
            }

            if (isRelationColumn(col)) {
                // Relational columns must be explicitly requested.
                if (!(requestedColumns && requestedColumns.find(x =>
                    x === pPathDot + colNameUpper || x.startsWith(pPathDot + colNameUpper + '.')
                )))
                    continue;

                const targetEntity = await col.resolveTarget();

                // Many and Lazy operations need sub execution task
                if (col.hasMany || col.lazy) {

                    const curCols = col.getColumns();
                    const targetCols = await col.resolveTargetColumns();
                    const cinfos = curCols.map(c =>
                        this._addDataColumn(queryColumns, c, tableAlias));

                    // Filter requested columns and select only paths for target entity only
                    const rx = new RegExp(col.name + '\\.(.+)');
                    const _columns = options.columns && options.columns.reduce<string[]>((a, v) => {
                        const m = v.match(rx);
                        if (m)
                            a.push(m[1]);
                        return a;
                    }, []);

                    // Eager subQuery must contain foreign fields
                    if (!col.lazy && _columns)
                        targetCols.forEach(c => {
                            if (!_columns.includes(c.name))
                                _columns.push(c.name);
                        });

                    const filter = cinfos.map((x, i) => {
                        if (col.lazy)
                            return Eq(targetCols[i].name, Param(x.alias));
                        return In(targetCols[i].name, Param(x.alias));
                    });
                    const subTask = new FindTask(this.executor, targetEntity.ctor);
                    const subTaskAliases = cinfos.map(x => x.alias);
                    const subTaskOptions: FindOptions = {
                        columns: _columns && _columns.length ? _columns : undefined,
                        filter
                    };
                    queryColumns.push({
                        name: col.name,
                        entity: entityDef,
                        column: col,
                        path: parentPath,
                        pathEntities,
                        tableAlias: '',
                        alias: '',
                        sqlClause: '',
                        visible: true,
                        subTask,
                        subTaskOptions,
                        subTaskAliases
                    });
                    continue;
                }

                // Eager one-one related
                const join = await this._addJoin(args.joins, args.tableAlias, col);
                await this._processColumns({
                    options,
                    queryColumns,
                    joins,
                    entityDef: join.targetEntity,
                    tableAlias: join.tableAlias,
                    parentPath: [...(parentPath || []), col.name],
                    pathEntities: [...(pathEntities || []), targetEntity]
                });

            }
        }
    }

    private _addDataColumn(queryColumns: ColumnInfo[],
                           column: DataColumnDefinition,
                           tableAlias: string): ColumnInfo {
        let cinfo = queryColumns.find(x => x.column === column);
        if (cinfo)
            return cinfo;
        const alias = tableAlias + '_' + column.name.toUpperCase();
        cinfo = {
            name: column.name,
            column,
            entity: column.entity,
            tableAlias,
            alias,
            sqlClause: `${tableAlias}.${column.fieldName} as ${alias}`,
            visible: false
        };
        queryColumns.push(cinfo);
        return cinfo;
    }

    private async _addJoin(joins: JoinInfo[], tableAlias: string, col: RelationColumnDefinition): Promise<JoinInfo> {
        let join = joins.find(j => j.relation === col);
        if (join)
            return join;
        const jointAlias = 'J' + (joins.length + 1);
        join = {
            relation: col,
            targetEntity: await col.resolveTarget(),
            tableAlias: jointAlias,
            condition: []
        }
        const curCols = col.getColumns();
        const targetCols = await col.resolveTargetColumns();
        for (let i = 0; i < curCols.length; i++) {
            join.condition.push(
                Eq(jointAlias + '.' + targetCols[i].fieldName,
                    Raw(tableAlias + '.' + curCols[i].fieldName))
            )
        }
        joins.push(join);
        return join;
    }

    private async _processFilter(entityDef: EntityDefinition,
                                 srcOp: LogicalOperator,
                                 trgOp: LogicalOperator,
                                 tableAlias = 'T'): Promise<void> {

        for (const item of srcOp._items) {
            if (isLogicalOperator(item)) {
                const ctor = Object.getPrototypeOf(item).constructor;
                const logOp: LogicalOperator = new ctor();
                await this._processFilter(entityDef, item, logOp, tableAlias);
                trgOp.add(logOp);
                continue;
            }
            if (isCompOperator(item)) {
                if (typeof item._expression === 'string') {
                    const itemPath = item._expression.split('.');
                    const l = itemPath.length;
                    let pt: string;
                    let _entityDef = entityDef;
                    let _tableAlias = tableAlias;
                    for (let i = 0; i < l; i++) {
                        pt = itemPath[i];
                        const col = _entityDef.getColumn(pt);
                        if (!col)
                            throw new Error(`Unknown column (${item._expression}) defined in filter`);
                        // if last item on path
                        if (i === l - 1) {
                            if (!isDataColumn(col))
                                throw new Error(`Invalid column (${item._expression}) defined in filter`);
                            const ctor = Object.getPrototypeOf(item).constructor;
                            trgOp.add(new ctor(_tableAlias + '.' + col.fieldName, item._value));
                        } else {
                            if (!isRelationColumn(col))
                                throw new Error(`Invalid column (${item._expression}) defined in filter`);
                            const targetEntity = await col.resolveTarget();
                            const trgAlias = 'E' + (i + 1);
                            const select = Select(Raw('1'))
                                .from(targetEntity.tableName + ' ' + trgAlias);
                            trgOp.add(Exists(select));
                            for (let k = 0; k < col.column.length; k++) {
                                const curCol = col.entity.getDataColumn(col.column[k]);
                                if (!curCol)
                                    throw new Error(`Relation column "${col.name}" definition error. ` +
                                        ` ${col.entity.name} has no column "${col.column[k]}"`);
                                const targetCol = targetEntity.getDataColumn(col.targetColumn[k]);
                                if (!targetCol)
                                    throw new Error(`Relation column "${col.name}" definition error. ` +
                                        `${targetEntity.name} has no column "${col.targetColumn[k]}"`);
                                select.where(
                                    Eq(trgAlias + '.' + targetCol.fieldName, Raw(_tableAlias + '.' + curCol.fieldName))
                                )
                                trgOp = select._where as LogicalOperator;
                            }
                            _entityDef = targetEntity;
                            _tableAlias = trgAlias;
                        }
                    }
                    continue;
                }
            }
            trgOp.add(item);
        }
    }

    private _prepareSort(sort: string[]): string[] {
        const orderColumns: string[] = [];
        for (const item of sort) {
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
