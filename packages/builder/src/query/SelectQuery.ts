import {coerceToInt} from 'putil-varhelpers';
import {Query} from './Query';
import {RawStatement} from '../sql-objects/RawStatement';
import {TableName} from '../sql-objects/TableName';
import {SelectColumn} from '../sql-objects/SelectColumn';
import {SerializationType} from '../enums';
import {JoinStatement} from '../sql-objects/JoinStatement';
import {LogicalOperator} from '../sql-objects/operators/LogicalOperator';
import {GroupColumn} from '../sql-objects/GroupColumn';
import {OrderColumn} from '../sql-objects/OrderColumn';
import {printArray, Serializable, serializeFallback} from '../Serializable';
import {OpAnd} from '../sql-objects/operators/OpAnd';
import {SerializeContext} from '../types';

export class SelectQuery extends Query {

    _tables?: Serializable[];
    _columns?: Serializable[];
    _joins?: JoinStatement[];
    _where?: LogicalOperator;
    _groupby?: (GroupColumn | RawStatement)[];
    _orderby?: (OrderColumn | RawStatement)[];
    _limit?: number;
    _offset?: number;
    _alias?: string;

    constructor(...column: (string | string[] | Serializable)[]) {
        super();
        if (column.length)
            this.addColumn(...column);
    }

    get _type(): SerializationType {
        return SerializationType.SELECT_QUERY;
    }

    /**
     * Adds columns to query.
     */
    addColumn(...column: (string | string[] | Serializable)[]): this {
        const self = this;
        this._columns = this._columns || [];
        for (const arg of column) {
            if (!arg) continue;
            if (Array.isArray(arg))
                self.addColumn(...arg);
            else
                this._columns.push(arg instanceof Serializable ? arg : new SelectColumn(arg));
        }
        return this;
    }

    /**
     * Defines "from" part of  query.
     */
    from(...table: (string | RawStatement | SelectQuery)[]): this {
        this._tables = [];
        for (const arg of table) {
            if (!arg) continue;
            this._tables.push(typeof arg === 'string' ? new TableName(arg) : arg);
        }
        return this;
    }

    /**
     * Adds "join" statements to query
     */
    join(...join: JoinStatement[]): this {
        this._joins = this._joins || [];
        for (const arg of join) {
            if (!arg) continue;
            if (arg._type !== SerializationType.JOIN)
                throw new TypeError('Join instance required');
            this._joins.push(arg);
        }
        return this;
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
     * Defines "where" part of query
     */
    groupBy(...field: (string | RawStatement)[]): this {
        this._groupby = [];
        for (const arg of field) {
            if (!arg) continue;
            this._groupby.push(typeof arg === 'string' ? new GroupColumn(arg) : arg);
        }
        return this;
    }

    /**
     * Defines "order by" part of query.
     */
    orderBy(...field: (string | RawStatement)[]): this {
        this._orderby = [];
        for (const arg of field) {
            if (!arg) continue;
            this._orderby.push(typeof arg === 'string' ? new OrderColumn(arg) : arg);
        }
        return this;
    }

    /**
     * Sets alias for sub-select queries
     */
    as(alias): this {
        this._alias = alias;
        return this;
    }

    /**
     * Sets limit for query
     */
    limit(limit: number): this {
        this._limit = coerceToInt(limit);
        return this;
    }

    /**
     * Sets offset for query
     */
    offset(offset: number): this {
        this._offset = coerceToInt(offset);
        return this;
    }

    onFetch(listener: (...args: any[]) => void): this {
        this.on('fetch', listener);
        return this;
    }

    onceFetch(listener: (...args: any[]) => void): this {
        this.once('fetch', listener);
        return this;
    }

    /**
     * Performs serialization
     */
    _serialize(ctx: SerializeContext): string {
        const o = {
            columns: this.__serializeSelectColumns(ctx),
            from: this.__serializeFrom(ctx),
            join: this.__serializeJoins(ctx),
            where: this.__serializeWhere(ctx),
            groupBy: this.__serializeGroupColumns(ctx),
            orderBy: this.__serializeOrderColumns(ctx),
            limit: this._limit,
            offset: this._offset
        };

        return serializeFallback(ctx, this._type, o, () => {
            let out = 'select';
            // columns part
            /* istanbul ignore else */
            if (o.columns) {
                out += (o.columns.indexOf('\n') >= 0) ?
                    '\n\t' + o.columns + '\b' :
                    ' ' + o.columns;
            }

            // from part
            if (o.from) {
                out += (o.columns.length > 60 ||
                    o.columns.indexOf('\n') >= 0 ? '\n' : ' ') +
                    o.from;
            }

            // join part
            if (o.join)
                out += '\n' + o.join;

            // where part
            if (o.where)
                out += '\n' + o.where;

            // group by part
            if (o.groupBy)
                out += '\n' + o.groupBy;

            // order by part
            if (o.orderBy)
                out += '\n' + o.orderBy;

            return out;
        });
    }

    /**
     *
     */
    protected __serializeSelectColumns(ctx: SerializeContext): string {
        const arr: string[] = [];
        if (this._columns)
            for (const t of this._columns) {
                const s = t._serialize(ctx);
                if (s) {
                    if (t instanceof SelectQuery) {
                        if (!t._alias)
                            throw new TypeError('Alias required for sub-select in columns');
                        arr.push('(' + s + ') ' + t._alias);
                    } else
                        arr.push(s);
                }
            }
        return serializeFallback(ctx, SerializationType.SELECT_QUERY_COLUMNS, arr,
            () => printArray(arr) || '*');
    }

    /**
     *
     */
    protected __serializeFrom(ctx: SerializeContext): string {
        const arr: string[] = [];
        if (this._tables)
            for (const t of this._tables) {
                const s = t._serialize(ctx);
                /* istanbul ignore else */
                if (s) {
                    if (t instanceof SelectQuery) {
                        if (!t._alias)
                            throw new TypeError('Alias required for sub-select in "from"');
                        arr.push('\n\t(' + s + ') ' + t._alias);
                    } else
                        arr.push(s);
                }
            }
        return serializeFallback(ctx, SerializationType.SELECT_QUERY_FROM, arr, () => {
            const s = arr.join(',');
            return s ? ('from' + (s.substring(0, 1) !== '\n' ? ' ' : '') + s) : '';
        });
    }

    /**
     *
     */
    protected __serializeJoins(ctx: SerializeContext): string {
        const arr: string[] = [];
        if (this._joins)
            for (const t of this._joins) {
                const s = t._serialize(ctx);
                /* istanbul ignore else */
                if (s)
                    arr.push(s);
            }
        return serializeFallback(ctx, SerializationType.SELECT_QUERY_JOIN, arr, () => {
            return arr.join('\n');
        });
    }

    /**
     *
     */
    protected __serializeWhere(ctx: SerializeContext): string {
        if (!this._where)
            return '';
        const s = this._where._serialize(ctx);
        return serializeFallback(ctx, SerializationType.CONDITIONS_BLOCK, s, () => {
            /* istanbul ignore next */
            return s ? 'where ' + s : '';
        });
    }

    /**
     *
     */
    protected __serializeGroupColumns(ctx: SerializeContext): string {
        const arr: string[] = [];
        if (this._groupby)
            for (const t of this._groupby) {
                const s = t._serialize(ctx);
                /* istanbul ignore else */
                if (s)
                    arr.push(s);
            }
        return serializeFallback(ctx, SerializationType.SELECT_QUERY_GROUPBY, arr, () => {
            const s = printArray(arr);
            return s ? 'group by ' + s : '';
        });
    }

    protected __serializeOrderColumns(ctx: SerializeContext): string {
        const arr: string[] = [];
        if (this._orderby)
            for (const t of this._orderby) {
                const s = t._serialize(ctx);
                /* istanbul ignore else */
                if (s)
                    arr.push(s);
            }
        return serializeFallback(ctx, SerializationType.SELECT_QUERY_ORDERBY, arr, () => {
            const s = printArray(arr);
            return s ? 'order by ' + s : '';
        });
    }

}
