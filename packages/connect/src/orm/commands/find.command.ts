import {
    And, Eq, In, LeftOuterJoin,
    LogicalOperator,
    Param, Raw, Select, JoinStatement
} from '@sqb/builder';
import type {QueryExecutor} from '../../client/types';
import type {Repository} from '../repository';
import type {EntityMeta} from '../metadata/entity-meta';
import {prepareFilter} from '../util/prepare-filter';
import type {ColumnElementMeta} from '../metadata/column-element-meta';
import type {AssociationElementMeta} from '../metadata/association-element-meta';
import {RowTransformModel} from '../util/row-transform-model';
import {AssociationNode} from '../metadata/association-node';
import {isColumnElement, isEmbeddedElement, isAssociationElement} from '../helpers';

interface JoinInfo {
    association: AssociationNode;
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
        column: ColumnElementMeta;
    }>;
    joins?: JoinInfo[];
    requestElements?: string[];
    excludeElements?: string[];
    maxEagerFetch?: number;
    maxRelationLevel: number;
}

const SORT_ORDER_PATTERN = /^([-+])?(.*)$/;

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

        // Prepare list of included element names
        if (args.elements && args.elements.length)
            ctx.requestElements = args.elements.map(x => x.toLowerCase());
        // Add included elements to requestElements array
        if (args.include && args.include.length) {
            const requestElements = ctx.requestElements = ctx.requestElements ||
                entity.getColumnElementNames().map(x => x.toLowerCase());
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
        await this._addEntityElements(ctx, entity, ctx.model, 'T');

        // Wrap search filter to operator instances
        let where: LogicalOperator | undefined;
        if (args.filter) {
            where = And();
            await prepareFilter(entity, args.filter, where);
        }

        // Generate select query
        const columnSqls = Object.keys(ctx.sqlColumns)
            .map(x => ctx.sqlColumns[x].sqlStatement);

        const query = Select(...columnSqls)
            .from(entity.tableName + ' as T');

        if (args.distinct)
            query.distinct();

        if (where)
            query.where(...where._items);
        if (args.sort) {
            const sort = await this._prepareSort(ctx, entity, 'T', args.sort);
            query.orderBy(...sort);
        }
        if (args.offset)
            query.offset(args.offset);

        // joins must be added last
        if (ctx.joins)
            for (const j of ctx.joins) {
                query.join(j.join);
            }

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
                                            tableAlias: string): Promise<void> {

        const {excludeElements, requestElements} = ctx;

        for (const key of entity.elementKeys) {
            const col = entity.getElement(key);
            if (!col)
                continue;
            const colNameLower = col.name.toLowerCase();

            // Ignore element if in excluded list
            if (excludeElements && excludeElements.includes(colNameLower))
                continue;

            // Ignore element if not requested
            // Relational elements must be explicitly requested.
            if (!requestElements && isAssociationElement(col))
                continue;
            if (requestElements && !requestElements.find(
                x => x === colNameLower || x.startsWith(colNameLower + '.')
            )) continue;

            // Add field to select list
            if (isColumnElement(col)) {
                const fieldAlias = this._addSelectColumn(ctx, tableAlias, col);
                // Add column to transform model
                if (!col.hidden)
                    model.addDataElement(col, fieldAlias);
                continue;
            }

            if (isEmbeddedElement(col)) {
                const typ = await col.resolveType();
                const subModel = new RowTransformModel(typ, model);
                await this._addEntityElements({
                    ...ctx,
                    requestElements: extractSubElements(colNameLower, requestElements),
                    excludeElements: extractSubElements(colNameLower, excludeElements)
                }, typ, subModel, tableAlias);
                model.addNode(col, subModel);
                continue;
            }

            if (isAssociationElement(col)) {

                // OtO relation
                if (!col.association.returnsMany()) {
                    const joinInfo = await this._joinLinks(ctx, tableAlias, col);
                    const subModel = new RowTransformModel(joinInfo.targetEntity, model);
                    model.addNode(col, subModel);
                    // Add join fields to select columns list
                    await this._addEntityElements({
                            ...ctx,
                            requestElements: extractSubElements(colNameLower, requestElements),
                            excludeElements: extractSubElements(colNameLower, excludeElements)
                        },
                        joinInfo.targetEntity,
                        subModel, joinInfo.joinAlias);
                    continue;
                }

                // One-2-Many Eager relation
                const link = col.association;
                const sourceCol = await link.resolveSourceColumn();
                // We need to know key value to filter sub query.
                // So add key field into select columns
                const fieldAlias = this._addSelectColumn(ctx, tableAlias, sourceCol);
                model.addDataElement(sourceCol, fieldAlias);

                const filterCol = await link.resolveTargetColumn();
                const prepareOptions = {
                    elements: extractSubElements(colNameLower, requestElements),
                    exclude: extractSubElements(colNameLower, excludeElements),
                    filter: In(filterCol.name, Param(fieldAlias)),
                    maxEagerFetch: ctx.maxEagerFetch,
                    maxRelationLevel: ctx.maxRelationLevel - 1
                }
                model.addOne2ManyElement(col, fieldAlias, prepareOptions);
            }

        }
    }

    private static _addSelectColumn(ctx: FindCommandContext, tableAlias: string, column: ColumnElementMeta): string {
        const fieldAlias = tableAlias + '_' + column.name.toUpperCase();
        ctx.sqlColumns[fieldAlias] = {
            column,
            sqlStatement: tableAlias + '.' + column.fieldName + ' as ' + fieldAlias
        };
        return fieldAlias;
    }

    private static async _joinLinks(ctx: FindCommandContext, tableAlias: string,
                                    column: AssociationElementMeta): Promise<JoinInfo> {
        let ring = column.association;
        while (ring) {
            const joinInfo = await this._addJoin(ctx, tableAlias, ring);
            if (!ring.next)
                return joinInfo;
            tableAlias = joinInfo.joinAlias;
            ring = ring.next;
        }
        throw new Error('Column association is undefined');
    }

    private static async _addJoin(ctx: FindCommandContext, tableAlias: string,
                                  association: AssociationNode): Promise<JoinInfo> {
        ctx.joins = ctx.joins || [];
        let joinInfo = ctx.joins.find(j => j.association === association);
        if (joinInfo)
            return joinInfo;
        const targetEntity = await association.resolveTarget();
        const keyCol = await association.resolveSourceColumn();
        const targetCol = await association.resolveTargetColumn();

        const joinAlias = 'J' + (ctx.joins.length + 1);
        const join = LeftOuterJoin(targetEntity.tableName + ' as ' + joinAlias);
        join.on(Eq(joinAlias + '.' + targetCol.fieldName,
            Raw(tableAlias + '.' + keyCol.fieldName)))

        joinInfo = {
            association,
            targetEntity,
            joinAlias,
            join
        }
        ctx.joins.push(joinInfo);
        return joinInfo;
    }

    private static async _prepareSort(ctx: FindCommandContext,
                                      entityDef: EntityMeta,
                                      tableAlias: string,
                                      sort: string[]) {
        const orderColumns: string[] = [];
        for (const item of sort) {
            const m = item.match(SORT_ORDER_PATTERN);
            if (!m)
                throw new Error(`"${item}" is not a valid order expression`);

            let elName = m[2];
            let prefix = '';
            let suffix = '';
            let _entityDef = entityDef;
            if (elName.includes('.')) {
                const a: string[] = elName.split('.');
                while (a.length > 1) {
                    const col = _entityDef.getElement(a.shift() || '');
                    if (isEmbeddedElement(col)) {
                        _entityDef = await col.resolveType();
                        if (col.fieldNamePrefix)
                            prefix += col.fieldNamePrefix;
                        if (col.fieldNameSuffix)
                            suffix = col.fieldNameSuffix + suffix;
                    } else if (isAssociationElement(col) && !col.association.returnsMany()) {
                        const joinInfo = await this._joinLinks(ctx, 'T', col);
                        tableAlias = joinInfo.joinAlias;
                        _entityDef = joinInfo.targetEntity;
                    } else throw new Error(`Invalid column (${elName}) declared in sort property`);
                }
                elName = a.shift() || '';
            }
            const col = _entityDef.getElement(elName);
            if (!col)
                throw new Error(`Unknown element (${elName}) declared in sort property`);
            if (!isColumnElement(col))
                throw new Error(`Can not sort by "${elName}", because it is not a data column`);

            const dir = m[1] || '+';
            orderColumns.push((dir || '') + tableAlias + '.' + prefix + col.fieldName + suffix);
        }
        return orderColumns;
    }

}

function extractSubElements(colNameLower: string, elements?: string[]): string[] | undefined {
    if (!elements)
        return;
    const result = elements.reduce((trg: string[], v: string) => {
        if (v.startsWith(colNameLower + '.'))
            trg.push(v.substring(colNameLower.length + 1).toLowerCase())
        return trg;
    }, [] as string[]);
    return result.length ? result : undefined;
}
