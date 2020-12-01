import {escapeReserved, serializeFallback} from '../Serializable';
import {SerializationType} from '../enums';
import {Column} from './Column';
import {SerializeContext} from '../types';

const RETURNING_COLUMN_PATTERN = /^([a-zA-Z]\w*) *(?:as)? *(\w+)?(?:::(\w+))?$/;

export class ReturningColumn extends Column {

    _alias?: string;
    _dataType?: string;

    constructor(value: string) {
        super();
        const m = value.match(RETURNING_COLUMN_PATTERN);
        if (!m)
            throw new TypeError(`"${value}" does not match returning column format`);
        this._field = m[1];
        this._alias = m[2];
        this._dataType = m[3];
    }

    get _type(): SerializationType {
        return SerializationType.RETURNING_COLUMN;
    }

    _serialize(ctx: SerializeContext): string {
        const o = {
            field: this._field,
            alias: this._alias,
            dataType: this._dataType
        };
        return serializeFallback(ctx, this._type, o, () => {
            const f = o.alias || o.field;
            if (!f)
                return '';
            ctx.returningFields = ctx.returningFields || {};
            ctx.returningFields[f] = o;
            return escapeReserved(ctx, o.field) +
                (o.alias ? ' as ' + escapeReserved(ctx, o.alias) : '');
        });
    }

}
