import {And, Param, Update} from '@sqb/builder';
import {QueryExecutor} from '../../client/types';
import {EntityMeta} from '../metadata/entity-meta';
import {Repository} from '../repository';
import {prepareFilter} from '../util/prepare-filter';
import {isColumnElement, isEmbeddedElement} from '../helpers';

export type UpdateCommandArgs = {
    entity: EntityMeta;
    connection: QueryExecutor;
    values: any;
} & Repository.UpdateAllOptions;

type UpdateCommandContext = {
    entity: EntityMeta;
    queryParams: any;
    queryValues: any;
    queryFilter: any[];
    colCount: number;
}

export class UpdateCommand {

    // istanbul ignore next
    protected constructor() {
        throw new Error('This class is abstract');
    }

    static async execute(args: UpdateCommandArgs): Promise<number> {
        const {entity} = args;
        const tableName = entity.tableName;
        if (!tableName)
            throw new Error(`${entity.ctor.name} is not decorated with @Entity decorator`);

        // Create a context
        const ctx: UpdateCommandContext = {
            entity,
            queryParams: {},
            queryValues: {},
            queryFilter: [],
            colCount: 0,
        }

        // Prepare
        await this._prepareParams(ctx, entity, args.values);
        if (!ctx.colCount)
            return 0;

        if (args.filter)
            await this._prepareFilter(ctx, args.filter);
        const query = Update(tableName + ' as T', ctx.queryValues)
            .where(...ctx.queryFilter);
        const qr = await args.connection.execute(query, {
            params: args.params ? [...args.params, ctx.queryParams] : ctx.queryParams,
            objectRows: false,
            cursor: false
        });
        return qr.rowsAffected || 0;
    }

    protected static async _prepareFilter(ctx: UpdateCommandContext, filter: any) {
        if (filter) {
            const where = And();
            await prepareFilter(ctx.entity, filter, where);
            ctx.queryFilter.push(...where._items);
        }
    }

    protected static async _prepareParams(ctx: UpdateCommandContext,
                                          entity: EntityMeta, values: any) {
        let v;
        for (const col of entity.elements.values()) {
            v = values[col.name];
            if (isColumnElement(col)) {
                if (col.noUpdate)
                    continue;
                if (typeof col.serialize === 'function')
                    v = col.serialize(v, col, values);
                if (v === null && col.notNull)
                    throw new Error(`${entity.name}.${col.name} is required and can't be null`);
                if (v === undefined)
                    continue;
                col.checkEnumValue(v);
                const k = '$input_' + col.fieldName;
                ctx.queryValues[col.fieldName] = Param({
                    name: k,
                    dataType: col.dataType,
                    isArray: col.isArray
                });
                ctx.queryParams[k] = v;
                ctx.colCount++;
            } else if (v != null && isEmbeddedElement(col)) {
                const type = await col.resolveType();
                await this._prepareParams(ctx, type, v);
            }
        }
    }

}
