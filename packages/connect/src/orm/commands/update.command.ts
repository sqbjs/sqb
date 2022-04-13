import {And, Param, Update} from '@sqb/builder';
import {SqbConnection} from '../../client/SqbConnection';
import {ColumnElementMetadata} from '../interfaces/column-element-metadata';
import {EmbeddedElementMetadata} from '../interfaces/embedded-element-metadata';
import {EntityModel} from '../model/entity-model';
import {Repository} from '../repository.class';
import {isColumnElement, isEmbeddedElement} from '../util/orm.helper';
import {prepareFilter} from './command.helper';

export type UpdateCommandArgs = {
    entity: EntityModel;
    connection: SqbConnection;
    values: any;
} & Repository.UpdateAllOptions;

type UpdateCommandContext = {
    entity: EntityModel;
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
                                          entity: EntityModel,
                                          values: any,
                                          prefix?: string,
                                          suffix?: string) {
        let v;
        prefix = prefix || '';
        suffix = suffix || '';
        for (const col of Object.values(entity.elements)) {
            v = values[col.name];
            if (v === undefined)
                continue;
            if (isColumnElement(col)) {
                if (col.noUpdate)
                    continue;
                if (typeof col.serialize === 'function')
                    v = col.serialize(v, col.name);
                if (v === null && col.notNull)
                    throw new Error(`${entity.name}.${col.name} is required and can't be null`);
                if (v === undefined)
                    continue;
                ColumnElementMetadata.checkEnumValue(col, v);
                const fieldName = prefix + col.fieldName + suffix;
                const k = '$input_' + fieldName;
                ctx.queryValues[fieldName] = Param({
                    name: k,
                    dataType: col.dataType,
                    isArray: col.isArray
                });
                ctx.queryParams[k] = v;
                ctx.colCount++;
            } else if (v != null && isEmbeddedElement(col)) {
                const type = await EmbeddedElementMetadata.resolveType(col);
                await this._prepareParams(ctx, type, v, col.fieldNamePrefix, col.fieldNameSuffix);
            }
        }
    }

}
