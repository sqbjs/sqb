import {Query} from './Query';
import {RawStatement} from '../sql-objects/RawStatement';
import {SerializationType} from '../enums';
import {TableName} from '../sql-objects/TableName';
import {LogicalOperator} from '../sql-objects/operators/LogicalOperator';
import {OpAnd} from '../sql-objects/operators/OpAnd';
import {SerializeContext} from '../types';
import {serializeFallback} from '../Serializable';

export class DeleteQuery extends Query {

    _table: TableName | RawStatement;
    _where?: LogicalOperator;

    constructor(tableName: string | RawStatement) {
        super();
        if (!tableName || !(typeof tableName === 'string' || (tableName as RawStatement)._type === SerializationType.RAW))
            throw new TypeError('String or Raw instance required as first argument (tableName) for UpdateQuery');
        this._table = typeof tableName === 'string' ? new TableName(tableName) : tableName;
    }

    get _type(): SerializationType {
        return SerializationType.DELETE_QUERY;
    }

    /**
     * Defines "where" part of query
     */
    where(...operator): this {
        this._where = this._where || new OpAnd();
        this._where.add(...operator);
        return this;
    }

    /**
     * Performs serialization
     */
    _serialize(ctx: SerializeContext): string {
        const o = {
            table: this._table._serialize(ctx),
            where: this._serializeWhere(ctx)
        };
        let out = 'delete from ' + o.table;
        if (o.where)
            out += '\n' + o.where;
        return out;
    }

    /**
     *
     */
    _serializeWhere(ctx: SerializeContext): string {
        if (!this._where)
            return '';
        const s = this._where._serialize(ctx);
        return serializeFallback(ctx, 'where', s, () => {
            /* istanbul ignore next */
            return s ? 'where ' + s : '';
        });

    }

}
