import {Insert, Param} from '@sqb/builder';
import type {QueryExecutor} from '../../client/types';
import type {EntityMeta} from '../metadata/entity-meta';
import {isDataColumn} from '../metadata/data-column-meta';
import {isEmbeddedElement} from '../metadata/embedded-element-meta';

export type CreateCommandArgs = {
    entity: EntityMeta;
    connection: QueryExecutor;
    values: any;
    returning?: boolean;
}

type CreateCommandContext = {
    entity: EntityMeta;
    queryParams: any;
    queryValues: any;
    colCount: number;
}

export class CreateCommand {

    // istanbul ignore next
    protected constructor() {
        throw new Error('This class is abstract');
    }

    static async execute(args: CreateCommandArgs): Promise<any> {
        const {entity} = args;
        const tableName = entity.tableName;
        if (!tableName)
            throw new Error(`${entity.ctor.name} is not decorated with @Entity decorator`);

        // Create a context
        const ctx: CreateCommandContext = {
            entity,
            queryParams: {},
            queryValues: {},
            colCount: 0
        }

        // Prepare
        await this._prepareParams(ctx, entity, args.values);
        if (!ctx.colCount)
            throw new Error('No element given to create new entity instance');

        const query = Insert(tableName, ctx.queryValues);
        if (args.returning && entity.primaryIndex)
            query.returning(...entity.primaryIndex.columns);

        const qr = await args.connection.execute(query, {
            params: ctx.queryParams,
            objectRows: false,
            cursor: false
        });

        if (args.returning && qr.fields && qr.rows?.length) {
            const keyValues = {};
            for (const f of qr.fields.values()) {
                const fieldName = f.name.toLowerCase();
                for (const el of entity.elements.values()) {
                    if (isDataColumn(el) && el.fieldName.toLowerCase() === fieldName) {
                        keyValues[el.fieldName] = qr.rows[0][f.index]
                    }
                }
            }
            return keyValues;
        }
    }

    protected static async _prepareParams(ctx: CreateCommandContext,
                                          entity: EntityMeta, values: any) {
        let v;
        for (const col of entity.elements.values()) {
            v = values[col.name];
            if (v === undefined)
                continue;
            if (isDataColumn(col)) {
                if (col.noInsert)
                    continue;
                if (typeof col.serialize === 'function')
                    v = col.serialize(v, col, values);
                if (v === undefined)
                    continue;
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
