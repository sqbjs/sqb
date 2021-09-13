import {
    SerializerExtension,
    SerializeContext,
    DefaultSerializeFunction,
    SerializationType, OperatorType
} from '@sqb/builder';
import * as compareVersion from 'compare-versions';

const reservedWords = ['comment', 'dual'];

export class OracleSerializer implements SerializerExtension {

    dialect = 'oracle';

    isReservedWord(ctx, s) {
        return s && typeof s === 'string' &&
            reservedWords.includes(s.toLowerCase());
    }

    serialize(ctx: SerializeContext, type: SerializationType | string, o: any,
              defFn: DefaultSerializeFunction): string | undefined {
        switch (type) {
            case SerializationType.SELECT_QUERY:
                return this._serializeSelect(ctx, o, defFn);
            case SerializationType.SELECT_QUERY_FROM:
                return this._serializeFrom(ctx, o, defFn);
            case SerializationType.COMPARISON_EXPRESSION:
                return this._serializeComparison(ctx, o, defFn);
            case SerializationType.STRING_VALUE:
                return this._serializeStringValue(ctx, o, defFn);
            case SerializationType.DATE_VALUE:
                return this._serializeDateValue(ctx, o, defFn);
            case SerializationType.BOOLEAN_VALUE:
                return this._serializeBooleanValue(ctx, o);
            case SerializationType.RETURNING_BLOCK:
                return this._serializeReturning();
        }
    }

    private _serializeSelect(ctx: SerializeContext, o: any, defFn: DefaultSerializeFunction) {
        let out = defFn(ctx, o);
        const limit = o.limit || 0;
        const offset = Math.max((o.offset || 0), 0);

        if (limit || offset) {
            if (ctx.dialectVersion && compareVersion.compare(ctx.dialectVersion, '12', '>=')) {
                if (offset)
                    out += '\nOFFSET ' + offset + ' ROWS' +
                        (limit ? ' FETCH NEXT ' + limit + ' ROWS ONLY' : '');
                else out += '\nFETCH FIRST ' + limit + ' ROWS ONLY';
            } else {
                if (offset || o.orderBy) {
                    out = 'select * from (\n\t' +
                        'select /*+ first_rows(' + (limit || 100) +
                        ') */ t.*, rownum row$number from (\n\t' +
                        out + '\n\b' +
                        ') t' +
                        (limit ? ' where rownum <= ' + (limit + offset) : '') + '\n\b)';
                    if (offset)
                        out += ' where row$number >= ' + (offset + 1);
                } else {
                    out = 'select * from (\n\t' +
                        out + '\n\b' +
                        ') where rownum <= ' + limit;
                }
            }
        }
        return out;
    }

    private _serializeFrom(ctx: SerializeContext, o: any, defFn: DefaultSerializeFunction): string {
        return defFn(ctx, o) || 'from dual';
    }

    private _serializeComparison(ctx: SerializeContext, o: any, defFn: DefaultSerializeFunction): string {
        if (o.right) {
            if (o.right.expression.toLowerCase() === 'null') {
                if (o.operatorType === 'eq')
                    return defFn(ctx, {...o, operatorType: OperatorType.is, symbol: 'is'});
                if (o.operatorType === 'ne')
                    return defFn(ctx, {...o, operatorType: OperatorType.isNot, symbol: 'is not'});
            }
        }
        return defFn(ctx, o);
    }

    private _serializeStringValue(ctx: SerializeContext, o: any, defFn: DefaultSerializeFunction): string {
        if (typeof o === 'string') {
            if (o.match(/^\d{4}-\d{2}-\d{2}$/))
                return 'to_date(' + o + ', \'yyyy-mm-dd\')';
            if (o.match(/^\d{4}-\d{2}-\d{2}T/))
                return `to_timestamp_tz('${o}','yyyy-mm-dd"T"hh24:mi:sstzh:tzm')`;
        }
        return defFn(ctx, o);
    }

    private _serializeDateValue(ctx: SerializeContext, o: any, defFn: DefaultSerializeFunction): string {
        const s = defFn(ctx, o);
        return s && (s.length <= 12 ?
            'to_date(' + s + ', \'yyyy-mm-dd\')' :
            'to_date(' + s + ', \'yyyy-mm-dd hh24:mi:ss\')');
    }

    private _serializeBooleanValue(_ctx: SerializeContext, o: any): string {
        return o == null ? 'null' : (o ? '1' : '0');
    }

    private _serializeReturning(): string {
        return '';
    }

}
