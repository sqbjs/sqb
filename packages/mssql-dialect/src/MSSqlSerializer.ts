import {
    SerializerExtension,
    SerializeContext,
    DefaultSerializeFunction,
    SerializationType
} from '@sqb/builder';

const reservedWords = ['comment'];

export class MSSqlSerializer implements SerializerExtension {

    dialect = 'mssql';

    isReservedWord(ctx, s) {
        return s && typeof s === 'string' &&
            reservedWords.includes(s.toLowerCase());
    }

    serialize(ctx: SerializeContext, type: SerializationType | string, o: any,
              defFn: DefaultSerializeFunction): string | undefined {
        switch (type) {
            case SerializationType.SELECT_QUERY:
                return this._serializeSelect(ctx, o, defFn);
            case SerializationType.EXTERNAL_PARAMETER:
                return this._serializeParameter(ctx, o);
        }
    }

    private _serializeSelect(ctx: SerializeContext, o: any, defFn: DefaultSerializeFunction): string {
        let out = defFn(ctx, o);
        const limit = o.limit || 0;
        const offset = Math.max((o.offset || 0), 0);
        if (offset)
            out += '\nOFFSET ' + offset + ' ROWS';
        if (limit)
            out += (!offset ? '\n' : ' ') + 'FETCH NEXT ' + limit + ' ROWS ONLY';
        return out;
    }

    private _serializeParameter(ctx: SerializeContext, o: any): string {
        const prmValue = ctx.params && ctx.params[o.name];
        ctx.queryParams = ctx.queryParams || {};
        ctx.queryParams[o.name] = prmValue;
        return '@' + o.name;
    }

}
