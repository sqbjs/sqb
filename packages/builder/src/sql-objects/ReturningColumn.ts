import {escapeReserved, serializeFallback} from '../Serializable';
import {SerializationType} from '../enums';
import {Column} from './Column';
import {SerializeContext} from '../types';

const RETURNING_COLUMN_PATTERN = /^([a-zA-Z]\w*) *(?:as)? *(\w+)?$/;

export class ReturningColumn extends Column {

    _alias: string;

    constructor(field: string) {
        super();
        const m = field.match(RETURNING_COLUMN_PATTERN);
        if (!m)
            throw new TypeError(`"${field}" does not match returning column format`);
        this._field = m[1];
        this._alias = m[2];
    }

    get _type(): SerializationType {
        return SerializationType.RETURNING_COLUMN;
    }

    _serialize(ctx: SerializeContext): string {
        const o = {
            field: this._field,
            alias: this._alias
        };
        ctx.returningFields = ctx.returningFields || [];
        ctx.returningFields.push(o);
        return serializeFallback(ctx, this._type, o, () => {
            return escapeReserved(ctx, o.field) +
                (o.alias ? ' as ' + escapeReserved(ctx, o.alias) : '');
        });
    }

}


