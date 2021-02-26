import {
    And, Eq, In, LeftOuterJoin,
    LogicalOperator,
    Param, Raw, Select, JoinStatement
} from '@sqb/builder';
import type {QueryExecutor} from '../../client/types';
import type {Repository} from '../repository';
import type {EntityMeta} from '../metadata/entity-meta';
import {prepareFilter} from '../util/prepare-filter';
import {isDataColumn, DataColumnMeta} from '../metadata/data-column-meta';
import {isEmbeddedElement} from '../metadata/embedded-element-meta';
import {isRelationElement, RelationElementMeta} from '../metadata/relation-element-meta';
import {RowTransformModel} from '../util/row-transform-model';

const SORT_ORDER_PATTERN = /^([-+])?(.*)$/;

interface JoinInfo {
    column: RelationElementMeta;
    targetEntity: EntityMeta;
    joinAlias: string;
    join: JoinStatement
}

export type FindCommandArgs = {
    entity: EntityMeta;
    connection: QueryExecutor
} & Repository.FindAllOptions;

type FindCommandContext = {
    entity: EntityMeta;
    model: RowTransformModel;
    sqlColumns: Record<string, {
        sqlStatement: string;
        column: DataColumnMeta;
    }>;
    joins?: JoinInfo[];
    orderColumns?: string[];
    requestElements?: string[];
    excludeElements?: string[];
    maxEagerFetch?: number;
    maxRelationLevel: number;
}

export class FindCommand {

    protected constructor() {
        throw new Error('This class is abstract');
    }

    static async execute(args: FindCommandArgs): Promise<any[]> {
        const {entity} = args;
        const tableName = entity.tableName;
        if (!tableName)
            throw new Error(`${entity.ctor.name} is not decorated with @Entity decorator`);

        // Create a context
        const ctx: FindCommandContext = {
            entity,
            model: new RowTransformModel(entity),
            sqlColumns: {},
            maxEagerFetch: args.maxEagerFetch || 100000,
            maxRelationLevel: typeof args.maxRelationLevel === 'number' ? args.maxRelationLevel : 5
        }
        /* if (parentContext) {
            if (parentContext.entitiesQueried.includes(entity))
                throw new Error(`Circular query detected`);
            ctx.entitiesQueried.push(...parentContext.entitiesQueried);
        }
        ctx.entitiesQueried.push(entity); */

        // Prepare list of included element names
        if (args.elements && args.elements.length)
            ctx.requestElements = args.elements.map(x => x.toLowerCase());
        // Add included elements to requestElements array
        if (args.include && args.include.length) {
            const requestElements = ctx.requestElements = ctx.requestElements ||
                entity.getDataColumnNames().map(x => x.toLowerCase());
            for (const k of args.include) {
                if (!requestElements.includes(k.toLowerCase()))
                    requestElements.push(k.toLowerCase());
            }
        }
        if (ctx.requestElements) {
            ctx.requestElements.forEach(s => {
                const m = s.match(/\./);
                if (m && m.length > ctx.maxRelationLevel)
                    throw new Error(`Requested element ${s} exceeds maximum sub query limit`);
            })
        }
        // Prepare list of excluded element names
        if (args.exclude && args.exclude.length)
            ctx.excludeElements = args.exclude.map(x => x.toLowerCase());

        //
        await this._addEntityElements(ctx, entity, ctx.model, 'T', '');

        // Wrap search filter to operator instances
        let where: LogicalOperator | undefined;
        if (args.filter) {
            where = And();
            await prepareFilter(entity, args.filter, where);
        }
        if (args.sort)
            this._prepareSort(ctx, entity, args.sort)


        // Generate select query
        const columnSqls = Object.keys(ctx.sqlColumns)
            .map(x => ctx.sqlColumns[x].sqlStatement);

        const query = Select(...columnSqls)
            .from(entity.tableName + ' as T');

        if (ctx.joins)
            for (const j of ctx.joins) {
                query.join(j.join);
            }

        if (where)
            query.where(...where._items);
        if (ctx.orderColumns)
            query.orderBy(...ctx.orderColumns);
        if (args.offset)
            query.offset(args.offset);

        // Execute query
        const resp = await args.connection.execute(query, {
            params: args?.params,
            fetchRows: args?.limit,
            objectRows: false,
            cursor: false
        });

        // Create rows
        const rows: any[] = [];
        if (resp.rows && resp.fields) {
            const fields = resp.fields;
            return ctx.model.transform(args.connection, fields, resp.rows)
        }
        return rows;
    }

    private static async _addEntityElements(ctx: FindCommandContext,
                                            entity: EntityMeta,
                                            model: RowTransformModel,
                                            tableAlias: string,
                                            currentPath: string): Promise<void> {

        const pPathLower = currentPath.toLowerCase();
        const pPathDot = pPathLower ? pPathLower + '.' : '';
        for (const key of entity.elementKeys) {
            const col = entity.getElement(key);
            if (!col)
                continue;
            const colNameLower = col.name.toLowerCase();

            // Check if element is excluded
            if (ctx.excludeElements &&
                ctx.excludeElements.find(x => x === pPathDot + colNameLower || x === pPathLower))
                continue;

            // Check if element is requested
            if ((isDataColumn(col) || isEmbeddedElement(col)) && ctx.requestElements &&
                !ctx.requestElements.find(x => x === pPathDot + colNameLower || x === pPathLower))
                continue;

            if (isDataColumn(col)) {
                // Add select sql field
                const fieldAlias = this._addSelectColumn(ctx, tableAlias, col);
                // Add column to transform model
                if (!col.hidden)
                    model.addDataElement(col, fieldAlias);
                continue;
            }

            if (isEmbeddedElement(col)) {
                const typ = await col.resolveType();
                const subModel = new RowTransformModel(typ, model);
                await this._addEntityElements(ctx, typ, subModel, tableAlias,
                    currentPath ? currentPath + '.' + col.name : col.name);
                model.addNode(col, subModel);
                continue;
            }

            if (isRelationElement(col)) {
                // Relational columns must be explicitly requested.
                if (!(ctx.requestElements && ctx.requestElements.find(x =>
                    x === pPathDot + colNameLower || x.startsWith(pPathDot + colNameLower + '.')
                )))
                    continue;

                // Lazy resolver requires key column value.
                // So we need to add key column to result model
                if (col.lazy) {
                    const keyCol = await col.foreign.resolveKeyColumn();
                    const fieldAlias = this._addSelectColumn(ctx, tableAlias, keyCol);
                    model.addDataElement(keyCol, fieldAlias);
                    continue;
                }

                // One-2-One Eager relation
                if (!col.hasMany && !col.lazy) {
                    const joinInfo = await this._addJoin(ctx, tableAlias, col);
                    const subModel = new RowTransformModel(joinInfo.targetEntity, model);
                    model.addNode(col, subModel);
                    // Add join fields to select columns list
                    await this._addEntityElements(ctx,
                        joinInfo.targetEntity,
                        subModel, joinInfo.joinAlias,
                        currentPath ? currentPath + '.' + col.name : col.name);
                    continue;
                }

                // One-2-Many Eager relation
                const keyCol = await col.foreign.resolveKeyColumn();
                const targetCol = await col.foreign.resolveTargetColumn();
                // We need to know key value to filter sub query.
                // So add key field into select columns
                const fieldAlias = this._addSelectColumn(ctx, tableAlias, keyCol);
                model.addDataElement(keyCol, fieldAlias);

                // prepare requested columns and select only paths for target entity
                const _reqElements = ctx.requestElements && ctx.requestElements
                    .reduce((a, x) => {
                        if (x.startsWith(pPathDot + colNameLower + '.'))
                            a.push(x.substring(pPathDot.length + colNameLower.length + 1).toLowerCase())
                        return a;
                    }, [] as string[]);
                const _excludedElements = ctx.excludeElements && ctx.excludeElements
                    .reduce((a, x) => {
                        if (x.toLowerCase() === targetCol.name.toLowerCase())
                            return a;
                        if (x.startsWith(pPathDot + colNameLower + '.'))
                            a.push(x.substring(pPathDot.length + colNameLower.length + 1).toLowerCase())
                        return a;
                    }, [] as string[]);

                // Eager operation must contain foreign fields
                // if (_reqElements && !_reqElements.includes(targetCol.name.toLowerCase()))
                //    _reqElements.push(targetCol.name.toLowerCase());

                // Add element to result model
                const prepareOptions = {
                    elements: _reqElements && _reqElements.length ? _reqElements : undefined,
                    include: [targetCol.name],
                    exclude: _excludedElements && _excludedElements.length ? _excludedElements : undefined,
                    filter: In(targetCol.name, Param(fieldAlias)),
                    maxEagerFetch: ctx.maxEagerFetch,
                    maxRelationLevel: ctx.maxRelationLevel - 1
                }
                model.addOne2ManyEagerElement(col, fieldAlias, prepareOptions);
            }

        }
    }

    private static _addSelectColumn(ctx: FindCommandContext, tableAlias: string, column: DataColumnMeta): string {
        const fieldAlias = tableAlias + '_' + column.name.toUpperCase();
        ctx.sqlColumns[fieldAlias] = {
            column,
            sqlStatement: tableAlias + '.' + column.fieldName + ' as ' + fieldAlias
        };
        return fieldAlias;
    }

    private static async _addJoin(ctx: FindCommandContext, tableAlias: string, column: RelationElementMeta): Promise<JoinInfo> {
        ctx.joins = ctx.joins || [];
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

    private static _prepareSort(ctx: FindCommandContext, entityDef: EntityMeta, sort: string[]) {
        const orderColumns: string[] = [];
        for (const item of sort) {
            const m = item.match(SORT_ORDER_PATTERN);
            if (!m)
                throw new Error(`"${item}" is not a valid order expression`);
            const colName = m[2];
            const col = entityDef.getElement(colName);
            if (!col)
                throw new Error(`Unknown column (${colName}) declared in sort property`);
            if (!isDataColumn(col))
                throw new Error(`Can not sort by "${colName}", because it is not a data column`);
            const dir = m[1] || '+';
            orderColumns.push((dir || '') + col.fieldName);
        }
        if (orderColumns.length)
            ctx.orderColumns = orderColumns;
    }

}

