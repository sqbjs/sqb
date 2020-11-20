import {
    SerializerExtension,
    SerializeContext,
    DefaultSerializeFunction,
    SerializationType,
    Maybe
} from '@sqb/builder';

const reservedWords = ['comment'];

export class MSSqlSerializer implements SerializerExtension {

    dialect = 'mssql';

    isReservedWord(ctx, s) {
        return s && typeof s === 'string' &&
            reservedWords.includes(s.toLowerCase());
    }

    serialize(ctx: SerializeContext, type: SerializationType | string, o: any,
              defFn: DefaultSerializeFunction): Maybe<string> {
        switch (type) {
            case SerializationType.SELECT_QUERY:
                return this._serializeSelect(ctx, o, defFn);
            case SerializationType.EXTERNAL_PARAMETER:
                return this._serializeParameter(ctx, o);
        }
    }

    private _serializeSelect(ctx: SerializeContext, o: any, defFn: DefaultSerializeFunction): Maybe<string> {
        let out = defFn(ctx, o);
        const limit = o.limit || 0;
        const offset = Math.max((o.offset || 0), 0);
        if (offset)
            out += '\nOFFSET ' + offset + ' ROWS';
        if (limit)
            out += (!offset ? '\n' : ' ') + 'FETCH NEXT ' + limit + ' ROWS ONLY';
        return out;
    }

    private _serializeParameter(ctx: SerializeContext, name: string): Maybe<string> {
        const prmValue = ctx.values && ctx.values[name];
        ctx.queryParams = ctx.queryParams || {};
        ctx.queryParams[name] = prmValue;
        return '@' + name;
    }

}
