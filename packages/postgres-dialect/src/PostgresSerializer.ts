import {
    SerializerExtension,
    SerializeContext,
    DefaultSerializeFunction,
    SerializationType
} from '@sqb/builder';

const reservedWords = ['comment'];

export class PostgresSerializer implements SerializerExtension {

    dialect = 'postgres';

    isReservedWord(ctx, s) {
        return s && typeof s === 'string' &&
            reservedWords.includes(s.toLowerCase());
    }

    serialize(ctx: SerializeContext, type: SerializationType | string, o: any,
              defFn: DefaultSerializeFunction): string | undefined {
        switch (type) {
            case SerializationType.SELECT_QUERY:
                return this._serializeSelect(ctx, o, defFn);
            case SerializationType.COMPARISON_EXPRESSION:
                return this._serializeComparison(ctx, o, defFn);
            case SerializationType.EXTERNAL_PARAMETER:
                return this._serializeParameter(ctx, o, defFn);
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

    private _serializeComparison(ctx: SerializeContext, o: any, defFn: DefaultSerializeFunction): string {
        if (typeof o.right === 'string') {
            if (o.operatorType === 'in' && o.right.toLowerCase() === 'null') {
                o.symbol = '=';
            } else if (o.right.startsWith('(')) {
                if (o.operatorType === 'eq')
                    o.symbol = 'in';
                if (o.operatorType === 'ne')
                    o.symbol = 'not in';
            } else {
                if (o.right.substring(0, 1) === '$') {
                    if (o.operatorType === 'in') {
                        o.symbol = '=';
                        o.right = 'ANY(' + o.right + ')';
                    }
                    if (o.operatorType === 'notIn') {
                        o.symbol = '!=';
                        o.right = 'ANY(' + o.right + ')';
                    }
                }
            }
        }
        return defFn(ctx, o);
    }

    private _serializeParameter(ctx: SerializeContext, o: any, defFn: DefaultSerializeFunction): string {
        ctx.preparedParams = ctx.preparedParams || [];
        defFn(ctx, o);
        return '$' + ctx.preparedParams.length;
    }
}
