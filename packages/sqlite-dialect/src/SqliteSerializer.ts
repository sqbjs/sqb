import {
    SerializerExtension,
    SerializeContext,
    DefaultSerializeFunction,
    SerializationType
} from '@sqb/builder';

export class SqliteSerializer implements SerializerExtension {

    dialect = 'sqlite';

    serialize(ctx: SerializeContext, type: SerializationType | string, o: any,
              defFn: DefaultSerializeFunction): string | undefined {
        switch (type) {
            case SerializationType.SELECT_QUERY:
                return this._serializeSelect(ctx, o, defFn);
            case SerializationType.EXTERNAL_PARAMETER:
                return this._serializeParameter(ctx, o);
            case SerializationType.RETURNING_BLOCK:
                return this._serializeReturning(ctx, o, defFn);
        }
    }

    private _serializeSelect(ctx: SerializeContext, o: any, defFn: DefaultSerializeFunction): string {
        let out = defFn(ctx, o);
        const limit = o.limit || 0;
        const offset = Math.max((o.offset || 0), 0);
        if (limit)
            out += '\nLIMIT ' + limit;
        if (offset)
            out += (!limit ? '\n' : ' ') + 'OFFSET ' + offset;
        return out;
    }

    private _serializeParameter(ctx: SerializeContext, o: any): string {
        const prmValue = ctx.params && ctx.params[o.name];
        ctx.queryParams = ctx.queryParams || {};
        ctx.queryParams[o.name] = prmValue;
        return ':' + o.name;
    }

    // noinspection JSUnusedLocalSymbols
    private _serializeReturning(ctx: SerializeContext, arr: any[], defFn: DefaultSerializeFunction): string {
        defFn(ctx, arr);
        return '';
    }


}
