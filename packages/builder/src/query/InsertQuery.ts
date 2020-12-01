import {ReturningQuery} from './ReturningQuery';
import {SerializationType} from '../enums';
import {TableName} from '../sql-objects/TableName';
import {printArray, Serializable, serializeFallback, serializeObject} from '../Serializable';
import type {RawStatement} from '../sql-objects/RawStatement';
import type {SerializeContext} from '../types';
import type {SelectQuery} from './SelectQuery';

export class InsertQuery extends ReturningQuery {

    _table: TableName | RawStatement;
    _input: any;

    constructor(tableName: string | RawStatement, input) {
        super();
        if (!tableName || !(typeof tableName === 'string' || (tableName as RawStatement)._type === SerializationType.RAW))
            throw new TypeError('String or Raw instance required as first argument (tableName) for InsertQuery');
        if (!input || !((typeof input === 'object' && !Array.isArray(input)) ||
            input.isSelect))
            throw new TypeError('Object or SelectQuery instance required as second argument (input) for InsertQuery');
        this._table = typeof tableName === 'string' ? new TableName(tableName) : tableName;
        this._input = input;
    }

    get _type(): SerializationType {
        return SerializationType.INSERT_QUERY;
    }

    /**
     * Performs serialization
     */
    _serialize(ctx: SerializeContext): string {
        const o = {
            table: this._table._serialize(ctx),
            columns: this.__serializeColumns(ctx),
            values: this.__serializeValues(ctx),
            returning: this.__serializeReturning(ctx)
        };

        let out = 'insert into ' + o.table + '\n\t(' +
            o.columns + ')\n\bvalues\n\t(' + o.values + ')\b';
        if (o.returning)
            out += '\n' + o.returning;
        return out;
    }

    /**
     *
     */
    protected __serializeColumns(ctx: SerializeContext): string {
        let arr: string[];
        if (this._input instanceof Serializable && this._input._type === SerializationType.SELECT_QUERY) {
            arr = [];
            const cols = (this._input as SelectQuery)._columns;
            if (cols) {
                for (const col of cols) {
                    if ((col as any)._alias)
                        arr.push((col as any)._alias);
                    else if ((col as any)._field)
                        arr.push((col as any)._field);
                }
            }
        } else
            arr = Object.keys(this._input);
        return serializeFallback(ctx, SerializationType.INSERT_QUERY_COLUMNS, arr,
            () => printArray(arr));
    }

    /**
     *
     */
    protected __serializeValues(ctx: SerializeContext): string {
        if (this._input instanceof Serializable)
            return this._input._serialize(ctx);

        const arr: string[] = [];
        const allValues = this._input;
        for (const n of Object.keys(allValues)) {
            const s = serializeObject(ctx, allValues[n]);
            if (s)
                arr.push(s);
        }
        return serializeFallback(ctx, SerializationType.INSERT_QUERY_VALUES, arr,
            () => printArray(arr));
    }

}
