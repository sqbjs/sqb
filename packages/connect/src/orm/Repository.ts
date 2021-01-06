import {
    Operator,
    Eq,
    And,
    Param,
    Insert,
    LogicalOperator,
    isLogicalOperator,
    isCompOperator,
    Select, Raw, Exists, In, LeftOuterJoin, Count, Delete, Update
} from '@sqb/builder';
import {Client} from '../client/Client';
import {Connection} from '../client/Connection';
import {Constructor, LazyResolver, PickWritable} from './orm.types';
import {EntityDefinition} from './model/EntityDefinition';
import {FieldInfo, QueryExecutor, QueryResult} from '../client/types';
import {Maybe} from '../types';
import {
    ColumnDefinition,
    DataColumnDefinition,
    isDataColumn,
    isRelationColumn,
    RelationColumnDefinition
} from './model/ColumnDefinition';

const SORT_ORDER_PATTERN = /^([-+])?(.*)$/;

namespace Operation {

    export interface Context {
        entityDef: EntityDefinition;
    }

    export interface FindContext extends Context, Repository.FindOperationOptions {
        params?: any;
    }

    export interface CountContext extends Context, Repository.CountOperationOptions {
        params?: any;
    }

    export interface RemoveContext extends Context, Repository.RemoveAllOperationOptions {
        params?: any;
    }

    export interface ColumnInfo {
        column: ColumnDefinition;
        name: string;
        entity: EntityDefinition;
        tableAlias: string;
        alias: string;
        sqlClause: string;
        path?: string[];
        pathEntities?: EntityDefinition[];
        visible: boolean,
        subTask?: FindContext;
        subTaskOptions?: Repository.FindOperationOptions;
        subTaskAliases?: string[];
        eagerParams?: Record<string, any[]>;
    }

    export interface JoinInfo {
        relation: RelationColumnDefinition;
        targetEntity: EntityDefinition;
        tableAlias: string;
        condition: any[];
    }
}


export namespace Repository {

    export type SearchFilter = object | Operator | (object | Operator)[];

    export interface GetOptions {
        columns?: string[];
    }

    export interface FindOneOperationOptions {
        columns?: string[];
        filter?: SearchFilter;
        sort?: string[];
        offset?: number;
    }

    export interface FindOperationOptions extends FindOneOperationOptions {
        limit?: number;
        maxEagerFetch?: number;
    }

    export interface CountOperationOptions {
        filter?: SearchFilter;
    }

    export interface RemoveAllOperationOptions {
        filter?: SearchFilter;
    }

}

export class Repository<T> {
    private readonly _client: Client;
    private readonly _executor: QueryExecutor;
    private readonly _entityDef: EntityDefinition;
    private readonly _ctor: Constructor;

    constructor(client: Client | Connection, ctor: Constructor) {
        if (client instanceof Client) {
            this._client = client;
            this._executor = client;
        } else {
            this._executor = client;
            this._client = client.client;
        }
        this._ctor = ctor;
        this._entityDef = EntityDefinition.get(ctor);
    }

    async create(values: Partial<PickWritable<T>>): Promise<T> {
        const r = await this._create(values, true);
        const row = r && r.rows && r.rows[0];
        /* Merge input and auto generated columns into output instance*/
        if (row && r.fields) {
            const out = {} as T;
            for (const k of this._entityDef.columnKeys) {
                const col = this._entityDef.getColumn(k);
                const f = isDataColumn(col) && r.fields.get(col.fieldName);
                if (f)
                    out[k] = row[f.index];
                else if (values[k] !== undefined)
                    out[k] = values[k];
            }
            Object.setPrototypeOf(out, this._ctor.prototype);
            return out;
        }
        throw new Error('Unexpected response returned from adapter');
    }

    async createOnly(values: Partial<PickWritable<T>>): Promise<void> {
        await this._create(values, false);
    }

    count(options?: Repository.CountOperationOptions): Promise<number> {
        return this._count({
            ...options,
            entityDef: this._entityDef
        });
    }

    find(options?: Repository.FindOperationOptions): Promise<T[]> {
        return this._find({
            ...options,
            entityDef: this._entityDef
        });
    }

    async findOne(options?: Repository.FindOneOperationOptions): Promise<Maybe<T>> {
        const rows = await this._find({
            ...options,
            limit: 1,
            entityDef: this._entityDef
        });
        return rows && rows[0];
    }

    async get(keyValue: T | any | Record<string, any>, options?: Repository.GetOptions): Promise<Maybe<T>> {
        const opts: Repository.FindOperationOptions = {...options};
        opts.filter = [this.getKeyValues(keyValue)];
        opts.limit = 1;
        delete opts.offset;
        const rows = await this.find(opts);
        return rows && rows[0];
    }

    async remove(keyValue: T | any | Record<string, any>): Promise<boolean> {
        return !!(await this._remove({
            entityDef: this._entityDef,
            filter: [this.getKeyValues(keyValue)]
        }));
    }

    async removeAll(options?: Repository.RemoveAllOperationOptions): Promise<number> {
        return await this._remove({
            ...options,
            entityDef: this._entityDef
        });
    }

    async update(values: Partial<PickWritable<T>>): Promise<Partial<T>> {
        const r = await this._update(values, true);
        const row = r && r.rows && r.rows[0];
        if (!row)
            return {};
        /* Merge input and auto generated columns into output instance*/
        if (row && r && r.fields) {
            const out = {} as T;
            for (const k of this._entityDef.columnKeys) {
                const col = this._entityDef.getColumn(k);
                const f = isDataColumn(col) && r.fields.get(col.fieldName);
                if (f)
                    out[k] = row[f.index];
                else if (values[k] !== undefined)
                    out[k] = values[k];
            }
            return out;
        }
        throw new Error('Unexpected response returned from adapter');
    }

    async updateOnly(values: Partial<PickWritable<T>>): Promise<boolean> {
        const r = await this._update(values, false);
        return !!(r && r.rowsAffected);
    }

    getKeyValues(valueOrInstance: any | Record<string, any> | T): Record<string, any> {
        const entityDef = this._entityDef;
        const primaryIndex = entityDef.primaryIndex;
        if (!primaryIndex)
            throw new Error(`No primary fields defined for "${entityDef.name}" entity`);

        const primaryColumns = Array.isArray(primaryIndex.column) ?
            (primaryIndex.column.length > 1 ? primaryIndex.column : primaryIndex.column[0]) :
            primaryIndex.column;
        const validateCol = (k) => {
            const col = entityDef.getColumn(k);
            if (!col)
                throw new Error(`Unknown column (${k}) defined as primary key in entity "${entityDef.name}"`);
            if (!isDataColumn(col))
                throw new Error(`Column (${k}) defined as primary key in entity "${entityDef.name}" is not a data column`);
        }

        // if entities primary key has more than one key field
        if (Array.isArray(primaryColumns) && primaryColumns.length > 1) {
            if (typeof valueOrInstance !== 'object')
                throw new Error(`"${this._entityDef.name}" entity` +
                    ` has more than one primary key field and you must provide all values with an key/value pair`);

            const valueKeys = Object.keys(valueOrInstance);
            const valueKeysUpper = valueKeys.map(x => x.toUpperCase());

            const out: Record<string, any> = {};
            for (const k of primaryColumns) {
                const i = valueKeysUpper.indexOf(k.toUpperCase());
                if (i < 0)
                    throw new Error(`Value of key field "${this._entityDef.name}.${k}" required to perform this operation`);
                validateCol(k);
                out[k] = valueOrInstance[valueKeys[i]];
            }
            return out;
        }

        const primaryColumnName = primaryIndex.column as string;
        validateCol(primaryColumnName);
        if (typeof valueOrInstance === 'object') {
            const valueKeys = Object.keys(valueOrInstance);
            const valueKeysUpper = valueKeys.map(x => x.toUpperCase());
            const i = valueKeysUpper.indexOf(primaryColumnName.toUpperCase());
            if (i < 0)
                throw new Error(`Value of key field "${this._entityDef.name}.${primaryColumnName}" required to perform this operation`);
            return {[primaryColumnName]: valueOrInstance[valueKeys[i]]};
        }

        return {[primaryColumnName]: valueOrInstance};
    }

    protected async _create(values: Partial<PickWritable<T>>,
                            returnAutoGeneratedColumns?: boolean): Promise<QueryResult> {
        const input = {};
        const params = {};
        const returning: string[] | undefined = returnAutoGeneratedColumns ? [] : undefined;
        let v;
        for (const col of this._entityDef.columns.values()) {
            if (isDataColumn(col)) {
                v = values[col.name];
                if (returning && col.autoGenerate && col.canInsert)
                    returning.push(col.fieldName);
                if (v === undefined || col.insert === false)
                    continue;
                input[col.fieldName] = Param(col.fieldName);
                params[col.fieldName] = v;
            }
        }
        const query = Insert(this._entityDef.tableName, input);
        if (returning && returning.length)
            query.returning(...returning);
        return await this._executor.execute(query, {
            values: params,
            objectRows: false,
            cursor: false
        });
    }

    protected async _update(values: Partial<PickWritable<T>>,
                            returnAutoGeneratedColumns?: boolean): Promise<Maybe<QueryResult>> {
        const keyValues = this.getKeyValues(values);
        const input = {};
        const params = {};
        const returning: string[] | undefined = returnAutoGeneratedColumns ? [] : undefined;
        let v;
        let i = 0;
        for (const col of this._entityDef.columns.values()) {
            if (isDataColumn(col)) {
                if (returning && col.autoGenerate && col.canUpdate)
                    returning.push(col.fieldName);
                v = values[col.name];
                if (v === undefined || col.update === false ||
                    keyValues[col.name] !== undefined)
                    continue;
                i++;
                input[col.fieldName] = Param(col.fieldName);
                params[col.fieldName] = v;
            }
            if (i === 0)
                return;
        }
        const query = Update(this._entityDef.tableName, input)
            .where(keyValues);
        if (returning && returning.length)
            query.returning(...returning);
        return await this._executor.execute(query, {
            values: params,
            objectRows: false,
            cursor: false
        });
    }

    protected async _count(ctx: Operation.CountContext): Promise<number> {
        const {entityDef} = ctx;
        let filter: LogicalOperator | undefined;
        if (ctx.filter) {
            filter = And();
            await this._prepareFilter(entityDef, ctx.filter, filter);
        }
        const query = Select(Count()).from(entityDef.tableName + ' T');
        if (filter)
            query.where(...filter._items);
        // Execute query
        const resp = await this._executor.execute(query, {
            values: ctx?.params,
            objectRows: false,
            cursor: false,
        });
        return (resp && resp.rows && resp.rows[0][0]) || 0;
    }

    protected async _find(ctx: Operation.FindContext): Promise<T[]> {
        const {entityDef} = ctx;
        const queryColumns: Operation.ColumnInfo[] = [];
        const joins: Operation.JoinInfo[] = [];
        // Prepare filter must be executed first
        // Wrap search filter to operator instances
        let filter: LogicalOperator | undefined;
        if (ctx.filter) {
            filter = And();
            await this._prepareFilter(entityDef, ctx.filter, filter);
        }

        await this._processFindColumns({
            options: ctx,
            queryColumns,
            joins,
            entityDef,
            tableAlias: 'T'
        });

        const columnSqls = queryColumns.reduce<string[]>((a, x) => {
            if (x.sqlClause)
                a.push(x.sqlClause);
            return a;
        }, []);

        const query = Select(...columnSqls).from(entityDef.tableName + ' T');
        for (const j of joins) {
            query.join(
                LeftOuterJoin(j.targetEntity.tableName + ' as ' + j.tableAlias)
                    .on(...j.condition)
            )
        }
        if (filter)
            query.where(...filter._items);
        if (ctx.offset)
            query.offset(ctx.offset);
        if (ctx.sort)
            query.orderBy(...this._prepareSort(entityDef, ctx.sort));

        // Execute query
        const resp = await this._executor.execute(query, {
            values: ctx?.params,
            fetchRows: ctx.limit,
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

            let cinfo: Operation.ColumnInfo;
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
                            const subTask = cinfo.subTask as Operation.FindContext;
                            // const subOptions = cinfo.subTaskOptions as Repository.FindOperationOptions;
                            const hasMany = cinfo.column.hasMany;
                            const params: any = {};
                            for (const alias of cinfo.subTaskAliases as string[]) {
                                const f = fields.get(alias);
                                params[alias] = f && src[f.index];
                            }
                            trg[cinfo.name] = (async (options?: Repository.FindOperationOptions) => {
                                const _ctx = {
                                    ...options,
                                    entityDef: subTask.entityDef,
                                    columns: options && options.columns ?
                                        options.columns : subTask.columns,
                                    filter: options && options.filter ?
                                        // @ts-ignore
                                        [...subTask.filter, options.filter] : subTask.filter,
                                    params
                                };
                                const r = await this._find(_ctx);
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
                Object.setPrototypeOf(trg, entityDef.ctor.prototype);
                rows.push(trg as T);
            }

            // Fetch one-2-many related rows and merge with result rows
            for (let colIdx = 0; colIdx < colLen; colIdx++) {
                cinfo = queryColumns[colIdx];
                if (isRelationColumn(cinfo.column) && cinfo.subTask && !cinfo.column.lazy) {
                    const subTask = cinfo.subTask as Operation.FindContext;
                    // const subOptions = cinfo.subTaskOptions as Repository.FindOperationOptions;
                    const _ctx = {
                        ...subTask,
                        params: cinfo.eagerParams,
                        limit: ctx.maxEagerFetch || 100000
                    };
                    const subRows = new Set(await this._find(_ctx));
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

    protected async _remove(ctx: Operation.RemoveContext): Promise<number> {
        const {entityDef} = ctx;
        let filter: LogicalOperator | undefined;
        if (ctx.filter) {
            filter = And();
            await this._prepareFilter(entityDef, ctx.filter, filter);
        }
        const query = Delete(entityDef.tableName + ' T');
        if (filter)
            query.where(...filter._items);
        // Execute query
        const resp = await this._executor.execute(query, {
            values: ctx?.params,
            objectRows: false,
            cursor: false,
        });
        return (resp && resp.rowsAffected) || 0;
    }

    protected async _processFindColumns(args: {
        options: Repository.FindOperationOptions,
        queryColumns: Operation.ColumnInfo[];
        joins: Operation.JoinInfo[];
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
                    const subTask: Operation.FindContext = {
                        entityDef: targetEntity,
                        columns: _columns && _columns.length ? _columns : undefined,
                        filter
                    };
                    const subTaskAliases = cinfos.map(x => x.alias);
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
                        subTaskAliases
                    });
                    continue;
                }

                // Eager one-one related
                const join = await this._joinRelationTable(args.joins, args.tableAlias, col);
                await this._processFindColumns({
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

    protected _addDataColumn(queryColumns: Operation.ColumnInfo[],
                             column: DataColumnDefinition,
                             tableAlias: string): Operation.ColumnInfo {
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

    protected async _joinRelationTable(target: Operation.JoinInfo[],
                                       tableAlias: string,
                                       col: RelationColumnDefinition): Promise<Operation.JoinInfo> {
        let join = target.find(j => j.relation === col);
        if (join)
            return join;
        const jointAlias = 'J' + (target.length + 1);
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
        target.push(join);
        return join;
    }

    private async _prepareFilter(entityDef: EntityDefinition,
                                 filter: Repository.SearchFilter,
                                 trgOp: LogicalOperator,
                                 tableAlias = 'T'): Promise<void> {
        let srcOp: LogicalOperator;
        if (isLogicalOperator(filter))
            srcOp = filter;
        else {
            srcOp = And();
            if (Array.isArray(filter))
                srcOp.add(...filter);
            else srcOp.add(filter);
        }

        for (const item of srcOp._items) {
            if (isLogicalOperator(item)) {
                const ctor = Object.getPrototypeOf(item).constructor;
                const logOp: LogicalOperator = new ctor();
                await this._prepareFilter(entityDef, item, logOp, tableAlias);
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

    protected _prepareSort(entityDef: EntityDefinition, sort: string[]): string[] {
        const orderColumns: string[] = [];
        for (const item of sort) {
            const m = item.match(SORT_ORDER_PATTERN);
            if (!m)
                throw new Error(`"${item}" is not a valid order expression`);
            const colName = m[2];
            const col = entityDef.getColumn(colName);
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
