import {isReservedWord, serializeFallback} from '../Serializable';
import {SerializationType} from '../enums';
import {Column} from './Column';
import {SerializeContext} from '../types';

const TABLE_COLUMN_PATTERN = /^((?:[a-zA-Z_][\w$_]*\.){0,2}) *([0-9a-zA-Z_][\w$_]*|\*) *(?:as)? *([a-zA-Z_][\w$_]*)?$/;

export class SelectColumn extends Column {

    _alias?: string;

    constructor(value: string) {
        super();
        const m = value.match(TABLE_COLUMN_PATTERN);
        if (!m)
            throw new TypeError(`${value} does not match table column format`);
        this._field = m[2];
        if (m[1]) {
            const a = m[1].split(/\./g);
            a.pop();
            this._table = a.pop();
            this._schema = a.pop();
        }
        this._alias = this._field !== '*' ? m[3] : '';
    }

    get _type(): SerializationType {
        return SerializationType.SELECT_COLUMN;
    }

    _serialize(ctx: SerializeContext): string {
        const o = {
            schema: this._schema,
            table: this._table,
            field: this._field,
            alias: this._alias,
            isReservedWord: !!(this._field && isReservedWord(ctx, this._field))
        };
        return serializeFallback(ctx, this._type, o, () => {
            return (this._schema ? this._schema + '.' : '') +
                (this._table ? this._table + '.' : '') +
                (o.isReservedWord ? '"' + this._field + '"' : this._field) +
                (this._alias ? ' ' + this._alias : '');
        });
    }

}
