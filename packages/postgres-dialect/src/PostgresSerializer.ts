import {
    SerializerExtension,
    SerializeContext,
    DefaultSerializeFunction,
    SerializationType,
    Maybe
} from '@sqb/builder';

const reservedWords = ['comment'];

export class PostgresSerializer implements SerializerExtension {

    dialect = 'postgres';

    isReservedWord(ctx, s) {
        return s && typeof s === 'string' &&
            reservedWords.includes(s.toLowerCase());
    }

    serialize(ctx: SerializeContext, type: SerializationType | string, o: any,
              defFn: DefaultSerializeFunction): Maybe<string> {
        switch (type) {
            case SerializationType.SELECT_QUERY:
                return this._serializeSelect(ctx, o, defFn);
            case SerializationType.COMPARISON_EXPRESSION:
                return this._serializeComparison(ctx, o, defFn);
            case SerializationType.EXTERNAL_PARAMETER:
                return this._serializeParameter(ctx, o);
        }
    }

    private _serializeSelect(ctx: SerializeContext, o: any, defFn: DefaultSerializeFunction): Maybe<string> {
        let out = defFn(ctx, o);
        const limit = o.limit || 0;
        const offset = Math.max((o.offset || 0), 0);
        if (limit)
            out += '\nLIMIT ' + limit;
        if (offset)
            out += (!limit ? '\n' : ' ') + 'OFFSET ' + offset;
        return out;
    }

    private _serializeComparison(ctx: SerializeContext, o: any, defFn: DefaultSerializeFunction): Maybe<string> {
        if (typeof o.value === 'string') {
            if (o.value.startsWith('(')) {
                if (o.operatorType === 'eq')
                    o.symbol = 'in';
                if (o.operatorType === 'ne')
                    o.symbol = 'not in';
            } else {
                if (o.value.substring(0, 1) === '$') {
                    if (o.operatorType === 'in') {
                        o.symbol = '=';
                        o.value = 'ANY(' + o.value + ')';
                    }
                    if (o.operatorType === 'notIn') {
                        o.symbol = '!=';
                        o.value = 'ANY(' + o.value + ')';
                    }
                }
            }
        }
        return defFn(ctx, o);
    }

    private _serializeParameter(ctx: SerializeContext, name: string): Maybe<string> {
        const prmValue = ctx.values && ctx.values[name];
        ctx.queryParams = ctx.queryParams || [];
        ctx.queryParams.push(prmValue);
        return '$' + ctx.queryParams.length;
    }
}
