import {
    SerializerExtension,
    SerializeContext,
    DefaultSerializeFunction,
    SerializationType,
    Maybe,
    escapeReserved
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
              defFn: DefaultSerializeFunction): Maybe<string> {
        switch (type) {
            case SerializationType.SELECT_QUERY:
                return this._serializeSelect(ctx, o, defFn);
            case SerializationType.SELECT_QUERY_FROM:
                return this._serializeFrom(ctx, o, defFn);
            case SerializationType.COMPARISON_EXPRESSION:
                return this._serializeComparison(ctx, o, defFn);
            case SerializationType.DATE_VALUE:
                return this._serializeDateValue(ctx, o, defFn);
            case SerializationType.RETURNING_COLUMN:
                return this._serializeReturningColumn(ctx, o, defFn);
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

    private _serializeFrom(ctx: SerializeContext, o: any, defFn: DefaultSerializeFunction): Maybe<string> {
        return defFn(ctx, o) || 'from dual';
    }

    private _serializeComparison(ctx: SerializeContext, o: any, defFn: DefaultSerializeFunction): Maybe<string> {
        if (o.value === 'null') {
            if (o.operatorType === 'eq')
                o.symbol = 'is';
            if (o.operatorType === 'ne')
                o.symbol = 'is not';
        }
        return defFn(ctx, o);
    }

    private _serializeDateValue(ctx: SerializeContext, o: any, defFn: DefaultSerializeFunction): Maybe<string> {
        const s = defFn(ctx, o);
        return s && (s.length <= 12 ?
            'to_date(' + s + ', \'yyyy-mm-dd\')' :
            'to_date(' + s + ', \'yyyy-mm-dd hh24:mi:ss\')');
    }

    private _serializeReturningColumn(ctx: SerializeContext, o: any, defFn: DefaultSerializeFunction): Maybe<string> {
        o.alias = 'returning$' + (o.alias || o.field);
        defFn(ctx, o);
        return escapeReserved(ctx, o.field) + ' into :' + o.alias;
    }
}
