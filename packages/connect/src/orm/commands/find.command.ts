import {And, Eq, In, LeftOuterJoin, LogicalOperator, Param, Raw, Select} from '@sqb/builder';
import {FieldInfo, QueryExecutor} from '../../client/types';
import {
    ColumnDefinition,
    DataColumnDefinition,
    isDataColumn,
    isRelationColumn,
    RelationColumnDefinition
} from '../ColumnDefinition';
import {Repository} from '../Repository';
import {LazyResolver} from '../orm.types';
import {EntityDefinition} from '../EntityDefinition';
import {prepareFilter} from './filter.helper';

const SORT_ORDER_PATTERN = /^([-+])?(.*)$/;

export type FindCommandArgs = {
    executor: QueryExecutor;
    entityDef: EntityDefinition;
} & Repository.FindAllOptions;

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
    subTask?: FindCommandArgs;
    subTaskAliases?: string[];
    eagerParams?: Record<string, any[]>;
}

interface JoinInfo {
    relation: RelationColumnDefinition;
    targetEntity: EntityDefinition;
    tableAlias: string;
    condition: any[];
}

export async function findAll<T = any>(args: FindCommandArgs): Promise<T[]> {
    const {executor, entityDef} = args;

    const queryColumns: ColumnInfo[] = [];
    const joins: JoinInfo[] = [];
    // Prepare filter must be executed first
    // Wrap search filter to operator instances
    let where: LogicalOperator | undefined;
    if (args.filter) {
        where = And();
        await prepareFilter(entityDef, args.filter, where);
    }

    await processColumns({
        ...args,
        queryColumns,
        joins,
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
    if (where)
        query.where(...where._items);
    if (args.offset)
        query.offset(args.offset);
    if (args.sort)
        query.orderBy(...prepareSort(entityDef, args.sort));

    // Execute query
    const resp = await executor.execute(query, {
        values: args.params,
        fetchRows: args.limit,
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
                        const subTask = cinfo.subTask as FindCommandArgs;
                        const hasMany = cinfo.column.hasMany;
                        const _params: any = {};
                        for (const alias of cinfo.subTaskAliases as string[]) {
                            const f = fields.get(alias);
                            _params[alias] = f && src[f.index];
                        }
                        trg[cinfo.name] = (async (options?: Repository.FindAllOptions) => {
                            const _ctx = {
                                ...options,
                                executor,
                                entityDef: subTask.entityDef,
                                columns: options && options.columns ?
                                    options.columns : subTask.columns,
                                filter: options && options.filter ?
                                    // @ts-ignore
                                    [...subTask.filter, options.filter] : subTask.filter,
                                params: _params
                            };
                            const r = await findAll(_ctx);
                            return hasMany ? r : r[0];
                        }) as LazyResolver<any>;

                    } else {
                        // Keep a list of key field/value pairs to fetch rows for eager relation
                        const _params = cinfo.eagerParams = cinfo.eagerParams || {};
                        for (const alias of cinfo.subTaskAliases as string[]) {
                            const f = fields.get(alias);
                            const v = f && src[f.index];
                            if (v != null) {
                                _params[alias] = _params[alias] || [];
                                _params[alias].push(v);
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
                const subTask = cinfo.subTask as FindCommandArgs;
                const _ctx = {
                    ...subTask,
                    params: cinfo.eagerParams,
                    limit: args.maxEagerFetch || 100000
                };
                const subRows = new Set(await findAll(_ctx));
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

export async function processColumns(args: FindCommandArgs & {
    queryColumns: ColumnInfo[];
    joins: JoinInfo[];
    tableAlias: string;
    parentPath?: string[];
    pathEntities?: EntityDefinition[];
}): Promise<void> {
    const {
        parentPath,
        entityDef,
        queryColumns,
        tableAlias,
        pathEntities,
        joins,
    } = args;
    const requestedColumns = args.columns ?
        args.columns.map(x => x.toUpperCase()) : undefined;
    const pPath = parentPath ? parentPath.join('.') : ''
    const pPathUpper = pPath.toUpperCase();
    const pPathDot = pPathUpper ? pPathUpper + '.' : '';

    for (const col of entityDef.columns.values()) {
        const colNameUpper = col.name.toUpperCase();

        if (isDataColumn(col)) {
            if (requestedColumns && !requestedColumns.find(
                x => x === pPathDot + colNameUpper || x === pPathUpper))
                continue;
            const cinfo = addDataColumn(queryColumns, col, tableAlias);
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
                    addDataColumn(queryColumns, c, tableAlias));

                // Filter requested columns and select only paths for target entity only
                const rx = new RegExp(col.name + '\\.(.+)');
                const _columns = args.columns && args.columns.reduce<string[]>((a, v) => {
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
                const subTask: FindCommandArgs = {
                    executor: args.executor,
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
            const join = await joinRelationTable(args.joins, args.tableAlias, col);
            await processColumns({
                ...args,
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

function addDataColumn(queryColumns: ColumnInfo[],
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

async function joinRelationTable(target: JoinInfo[],
                                 tableAlias: string,
                                 col: RelationColumnDefinition): Promise<JoinInfo> {
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


function prepareSort(entityDef: EntityDefinition, sort: string[]): string[] {
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
        const dir = m[1] || '+';
        if (dir === '+' && !col.sortAscending)
            throw new Error(`Ascending sort on olumn "${colName}" is not allowed`);
        if (dir === '-' && !col.sortDescending)
            throw new Error(`Descending sort on olumn "${colName}" is not allowed`);
        orderColumns.push((dir || '') + col.fieldName);
    }
    return orderColumns;
}
