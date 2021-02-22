import {
    And, Eq, In, LeftOuterJoin,
    LogicalOperator,
    Param, Raw, Select, JoinStatement
} from '@sqb/builder';
import type {SelectQuery} from '@sqb/builder';
import {QueryExecutor} from '../../client/types';
import {
    isRelationElement,
    RelationElementMeta
} from '../metadata/relation-element-meta';
import {Repository} from '../repository';
import {LazyResolver} from '../types';
import {EntityMeta} from '../metadata/entity-meta';
import {prepareFilter} from './filter.helper';
import {makeEntityInstance} from './wrap.helper';
import {FieldInfoMap} from '../../client/FieldInfoMap';
import {DataColumnMeta, isDataColumn} from '../metadata/data-column-meta';
import {EmbeddedElementMeta, isEmbeddedElement} from '../metadata/embedded-element-meta';

const SORT_ORDER_PATTERN = /^([-+])?(.*)$/;

interface FindCommandContext {
    entity: EntityMeta;
    sqlColumns: Record<string, {
        sqlStatement: string;
        column: DataColumnMeta;
    }>;
    joins: JoinInfo[];
    requestElements?: string[];
    excludeElements?: string[];
}

interface JoinInfo {
    column: RelationElementMeta;
    targetEntity: EntityMeta;
    joinAlias: string;
    join: JoinStatement
}

export type FindCommandExecuteOptions = Pick<Repository.FindAllOptions, 'params' | 'limit' | 'offset'>;
export type FindCommandPrepareOptions = Omit<Repository.FindAllOptions, 'params' | 'limit' | 'offset'>;

export class FindCommand<T = any> {
    maxEagerFetch?: number;

    protected constructor(
        private query: SelectQuery,
        private model: ResultModel) {
    }

    async execute(executor: QueryExecutor, options?: FindCommandExecuteOptions): Promise<T[]> {
        if (!this.query)
            throw new Error('Command has not been prepared yet');
        // Execute query
        this.query.offset(options?.offset || 0);
        const resp = await executor.execute(this.query, {
            params: options?.params,
            fetchRows: options?.limit,
            objectRows: false,
            cursor: false
        });

        // Create rows
        const rows: T[] = [];
        const model = this.model as ResultModel;
        if (resp.rows && resp.fields) {
            const fields = resp.fields;
            return this._wrapResultRows(executor, model, fields, resp.rows)
        }
        return rows;
    }

    private async _wrapResultRows(executor: QueryExecutor,
                                  model: ResultModel, fields: FieldInfoMap, rows: any): Promise<any> {
        const rowLen = rows.length;
        const result: any[] = [];
        for (let rowIdx = 0; rowIdx < rowLen; rowIdx++) {
            const o = await this._wrapResultRow(executor, model, fields, rows[rowIdx]);
            result.push(o);
        }
        if (!model.elementKeys)
            return result;

        // Fetch one-2-many related rows and merge with result rows
        const elementLen = model.elementKeys.length;
        for (let elIdx = 0; elIdx < elementLen; elIdx++) {
            const elKey = model.elementKeys[elIdx];
            const el = model.elements[elKey];
            const colName = el.column.name;
            if (ResultModel.isSubResultElement(el) && !el.column.lazy) {
                const subTask = el.subTask;
                const targetEntity = await el.column.foreign.resolveTarget();
                const command = await FindCommand.prepare(targetEntity, {
                    filter: subTask.filter,
                    elements: subTask.elements,
                    include: subTask.include,
                    exclude: subTask.exclude,
                    sort: subTask.sort,
                    // maxEagerFetch: undefined;
                });
                const subRows = new Set(await command.execute(executor, {params: el.eagerParams}));

                const keyCol = await el.column.foreign.resolveKeyColumnName();
                const trgCol = await el.column.foreign.resolveTargetColumnName();

                // init array value for column
                for (const row of result) {
                    row[colName] = [];
                }
                // Merge rows
                const rowCount = result.length;
                let row;
                for (let i = 0; i < rowCount; i++) {
                    row = result[i];
                    for (const subRow of subRows) {
                        if (subRow[trgCol] === row[keyCol]) {
                            row[colName].push(subRow);
                            subRows.delete(subRow);
                        }
                    }
                }
            }
        }
        return result;
    }

    private async _wrapResultRow(executor: QueryExecutor,
                                 model: ResultModel,
                                 fields: FieldInfoMap,
                                 row: any[]): Promise<any> {
        // Cache keys for better performance
        const elementKeys = model.elementKeys =
            (model.elementKeys = Object.keys(model.elements));
        const elementLen = elementKeys.length;
        const result = {};
        for (let elIdx = 0; elIdx < elementLen; elIdx++) {
            const elKey = elementKeys[elIdx];
            const el = model.elements[elKey];
            if (ResultModel.isDataResultElement(el)) {
                const field = fields.get(el.fieldAlias);
                if (field) {
                    let v = row[field.index];
                    if (typeof el.column.parse === 'function')
                        v = el.column.parse(v, el.column, result);
                    if (v !== null)
                        result[elKey] = v;
                }
            } else if (ResultModel.isNestedResultElement(el)) {
                result[elKey] = await this._wrapResultRow(executor, el.model, fields, row);
            }
            if (ResultModel.isSubResultElement(el)) {
                if (el.column.lazy) {
                    const subTask = el.subTask;
                    const hasMany = el.column.hasMany;
                    const _params: any = {};
                    const f = fields.get(el.keyFieldAlias);
                    _params[el.keyFieldAlias] = f && row[f.index];

                    result[elKey] = (async (options?: Repository.FindAllOptions) => {
                        const targetEntity = await el.column.foreign.resolveTarget();
                        const command = await FindCommand.prepare(targetEntity, {
                            filter: options && options.filter ?
                                // @ts-ignore
                                [...subTask.filter, options.filter] : subTask.filter,
                            elements: options && options.elements ?
                                options.elements : subTask.elements,
                            sort: options && options.sort ?
                                options.sort : subTask.sort,
                            // maxEagerFetch: undefined;
                        });
                        const r = await command.execute(executor, {...options, params: _params});
                        return hasMany ? r : r[0];
                    }) as LazyResolver<any>;
                } else {
                    // One2Many Eager element
                    // Keep a list of key field/value pairs to fetch rows for eager relation
                    const _params = el.eagerParams = el.eagerParams || {};
                    const f = fields.get(el.keyFieldAlias);
                    const v = f && row[f.index];
                    if (v != null) {
                        _params[el.keyFieldAlias] = _params[el.keyFieldAlias] || [];
                        _params[el.keyFieldAlias].push(v);
                    }
                }
            }
        }

        makeEntityInstance(result, model.entity.ctor);
        return result;
    }

    static async prepare(entity: EntityMeta, options: FindCommandPrepareOptions = {}): Promise<FindCommand> {
        return this._prepare(entity, '', options)
    }

    private static async _prepare(entity: EntityMeta, currentPath: string, options: FindCommandPrepareOptions = {}): Promise<FindCommand> {
        if (!entity.tableName)
            throw new Error(`${entity.ctor.name} is not decorated with @Entity decorator`);
        const ctx: FindCommandContext = {
            entity,
            sqlColumns: {},
            joins: []
        }
        if (options.elements && options.elements.length)
            ctx.requestElements = options.elements.map(x => x.toLowerCase());
        // Add included elements to requestElements array
        if (options.include && options.include.length) {
            if (!ctx.requestElements)
                ctx.requestElements = entity.getDataColumnNames()
                    .map(x => x.toLowerCase());
            for (const k of options.include) {
                if (!ctx.requestElements.includes(k.toLowerCase()))
                    ctx.requestElements.push(k.toLowerCase());
            }
        }
        if (options.exclude && options.exclude.length)
            ctx.excludeElements = options.exclude.map(x => x.toLowerCase());
        const model = new ResultModel(entity);
        await this._addEntityColumns(ctx, entity, model, 'T', currentPath);

        // Prepare filter must be executed first
        // Wrap search filter to operator instances
        let where: LogicalOperator | undefined;
        if (options.filter) {
            where = And();
            await prepareFilter(entity, options.filter, where);
        }

        const columnSqls = Object.keys(ctx.sqlColumns)
            .map(x => ctx.sqlColumns[x].sqlStatement);

        // Generate select query
        const query = Select(...columnSqls)
            .from(ctx.entity.tableName + ' as T');

        for (const j of ctx.joins) {
            query.join(j.join);
        }

        if (where)
            query.where(...where._items);
        if (options.sort)
            query.orderBy(...prepareSort(entity, options.sort));

        const command = new FindCommand(query, model);
        command.maxEagerFetch = options.maxEagerFetch;
        return command;
    }

    private static async _addEntityColumns(ctx: FindCommandContext,
                                           entity: EntityMeta,
                                           model: ResultModel,
                                           tableAlias: string,
                                           currentPath: string): Promise<void> {

        const pPathLower = currentPath.toLowerCase();
        const pPathDot = pPathLower ? pPathLower + '.' : '';
        for (const key of entity.elementKeys) {
            const col = entity.getColumn(key);
            if (!col)
                continue;
            const colNameLower = col.name.toLowerCase();

            // Check if element is excluded
            if (ctx.excludeElements && ctx.excludeElements
                .find(x => x === pPathDot + colNameLower || x === pPathLower))
                continue;

            // Check if element is requested
            if (isDataColumn(col) || isEmbeddedElement(col)) {
                if (ctx.requestElements && !ctx.requestElements
                    .find(x => x === pPathDot + colNameLower || x === pPathLower))
                    continue;
            }

            if (isDataColumn(col)) {
                // Add select sql field
                const fieldAlias = this._addSelectColumn(ctx, tableAlias, col);
                // Add column to result model
                if (!col.hidden)
                    model.elements[col.name] = {
                        column: col,
                        fieldAlias
                    };
                continue;
            }

            if (isEmbeddedElement(col)) {
                const typ = await col.resolveType();
                const subModel = new ResultModel(typ);
                // Add column to result model
                model.elements[col.name] = {
                    column: col,
                    model: subModel
                } as ResultModel.EmbeddedResultElement;
                await this._addEntityColumns(ctx, typ, subModel, tableAlias,
                    currentPath ? currentPath + '.' + col.name : col.name);
                continue;
            }

            if (isRelationElement(col)) {
                // Relational columns must be explicitly requested.
                if (!(ctx.requestElements && ctx.requestElements.find(x =>
                    x === pPathDot + colNameLower || x.startsWith(pPathDot + colNameLower + '.')
                )))
                    continue;

                // Eager one-2-one relation
                if (!col.hasMany && !col.lazy) {
                    const joinInfo = await this._addJoin(ctx, tableAlias, col);
                    const subModel = new ResultModel(joinInfo.targetEntity);
                    model.elements[col.name] = {
                        column: col,
                        model: subModel
                    } as ResultModel.EmbeddedResultElement;
                    // Add join fields to select columns list
                    await this._addEntityColumns(ctx, joinInfo.targetEntity,
                        subModel, joinInfo.joinAlias,
                        currentPath ? currentPath + '.' + col.name : col.name);
                    continue;
                }

                // One2One Lazy, One2Many Eager and One2Many Lazy operation
                // const targetEntity = await col.foreign.resolveTarget();
                const keyCol = await col.foreign.resolveKeyColumn();
                const targetCol = await col.foreign.resolveTargetColumn();
                // We need to know key value to filter sub query.
                // So add key field into select columns
                const colAlias = this._addSelectColumn(ctx, tableAlias, keyCol);

                // prepare requested columns and select only paths for target entity
                const _reqElements = ctx.requestElements && ctx.requestElements
                    .reduce((a, x) => {
                        if (x.startsWith(pPathDot + colNameLower + '.'))
                            a.push(x.substring(pPathDot.length + colNameLower.length + 1).toLowerCase())
                        return a;
                    }, [] as string[]);
                const _excludedElements = ctx.excludeElements && ctx.excludeElements
                    .reduce((a, x) => {
                        if (x.startsWith(pPathDot + colNameLower + '.'))
                            a.push(x.substring(pPathDot.length + colNameLower.length + 1).toLowerCase())
                        return a;
                    }, [] as string[]);

                // Eager operation must contain foreign fields
                if (!col.lazy && _reqElements && !_reqElements.includes(targetCol.name.toLowerCase()))
                    _reqElements.push(targetCol.name.toLowerCase());

                const filter = col.lazy ?
                    Eq(targetCol.name, Param(colAlias)) :
                    In(targetCol.name, Param(colAlias));

                // Add element to result model
                model.elements[col.name] = {
                    column: col,
                    subTask: {
                        elements: _reqElements && _reqElements.length ? _reqElements : undefined,
                        exclude: _excludedElements && _excludedElements.length ? _excludedElements : undefined,
                        filter
                    },
                    keyFieldAlias: colAlias
                } as ResultModel.SubQueryRelationElement;
            }

        }
    }

    private static _addSelectColumn(ctx: FindCommandContext, tableAlias: string,
                                    column: DataColumnMeta): string {
        const fieldAlias = tableAlias + '_' + column.name.toUpperCase();
        ctx.sqlColumns[fieldAlias] = {
            column,
            sqlStatement: tableAlias + '.' + column.fieldName + ' as ' + fieldAlias
        };
        return fieldAlias;
    }

    private static async _addJoin(ctx: FindCommandContext, tableAlias: string,
                                  column: RelationElementMeta): Promise<JoinInfo> {
        let joinInfo = ctx.joins.find(j => j.column === column);
        if (joinInfo)
            return joinInfo;
        const targetEntity = await column.foreign.resolveTarget();
        const keyCol = await column.foreign.resolveKeyColumn();
        const targetCol = await column.foreign.resolveTargetColumn();

        const joinAlias = 'J' + (ctx.joins.length + 1);
        const join = LeftOuterJoin(targetEntity.tableName + ' as ' + joinAlias);
        join.on(Eq(joinAlias + '.' + targetCol.fieldName,
            Raw(tableAlias + '.' + keyCol.fieldName)))

        joinInfo = {
            column,
            targetEntity,
            joinAlias,
            join
        }
        ctx.joins.push(joinInfo);
        return joinInfo;
    }
}


class ResultModel {
    entity: EntityMeta;
    elements: Record<string, ResultModel.DataColumnResultElement |
        ResultModel.EmbeddedResultElement | ResultModel.SubQueryRelationElement> = {};
    elementKeys?: string[];

    constructor(entity: EntityMeta) {
        this.entity = entity;
    }
}

namespace ResultModel {

    export interface DataColumnResultElement {
        column: DataColumnMeta;
        fieldAlias: string;
    }

    export interface EmbeddedResultElement {
        column: RelationElementMeta | EmbeddedElementMeta;
        model: ResultModel;
    }

    export interface SubQueryRelationElement {
        column: RelationElementMeta;
        subTask: FindCommandPrepareOptions;
        keyFieldAlias: string;
        eagerParams?: any;
    }

    export function isDataResultElement(value: any): value is DataColumnResultElement {
        return value && value.column && isDataColumn(value.column);
    }

    export function isNestedResultElement(value: any): value is EmbeddedResultElement {
        return !!(value && value.column && value.model &&
            (isRelationElement(value.column) || isEmbeddedElement(value.column)));
    }

    export function isSubResultElement(value: any): value is SubQueryRelationElement {
        return !!(value && value.column && isRelationElement(value.column) && value.subTask)
    }

}

function prepareSort(entityDef: EntityMeta, sort: string[]): string[] {
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
        orderColumns.push((dir || '') + col.fieldName);
    }
    return orderColumns;
}
