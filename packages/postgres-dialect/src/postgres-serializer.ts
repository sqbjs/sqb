import {
    DefaultSerializeFunction,
    OperatorType,
    SerializationType, SerializeContext,
    SerializerExtension
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
        if (o.right) {
            if (!Array.isArray(o.right)) {
                if (o.right.expression.toLowerCase() === 'null') {
                    if (o.operatorType === 'eq')
                        return defFn(ctx, {...o, operatorType: OperatorType.is, symbol: 'is'});
                    if (o.operatorType === 'ne')
                        return defFn(ctx, {...o, operatorType: OperatorType.isNot, symbol: 'is not'});
                }
            }

            if (o.left.isParam && o.left.isArray && o.left.value != null && !Array.isArray(o.left.value))
                o.left.value = [o.left.value];

            if (o.right.isParam && o.right.isArray && o.right.value != null && !Array.isArray(o.right.value))
                o.right.value = [o.right.value];

            if ((o.operatorType === 'in' || o.operatorType === 'notIn')) {
                if (o.left.isArray && !o.right.isArray && o.right.isParam) {
                    const left = o.left;
                    const right = o.right;
                    left.expression = 'ANY(' + left.expression + ')';
                    return defFn(ctx, {
                        ...o,
                        operatorType: OperatorType.eq,
                        symbol: o.operatorType === 'notIn' ? '!=' : '=',
                        left: right,
                        right: left
                    });
                }
                if (o.left.isArray && o.right.isArray) {
                    if (o.operatorType === 'notIn')
                        o.left.expression = 'not ' + o.left.expression;
                    return defFn(ctx, {...o, symbol: '&&'});
                }
                if (!o.left.isArray && o.right.isArray && o.right.isParam) {
                    o.right.expression = 'ANY(' + o.right.expression + ')';
                    return defFn(ctx, {
                        ...o,
                        operatorType: OperatorType.eq,
                        symbol: o.operatorType === 'notIn' ? '!=' : '='
                    });
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
