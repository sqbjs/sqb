/* SQB
 ------------------------
 (c) 2017-present Panates
 SQB may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/sqb/
 */
'use strict';

/**
 * Module dependencies.
 * @private
 */
const ArgumentError = require('errorex').ArgumentError;
const Query = require('./Query');
const Serializable = require('../Serializable');
const TableName = require('../sqlobject/TableName');
const SelectColumn = require('../sqlobject/SelectColumn');
const OrderColumn = require('../sqlobject/OrderColumn');
const GroupColumn = require('../sqlobject/GroupColumn');
const OpAnd = require('../sqlobject/operators/OpAnd');

/**
 *
 * @class
 */
class SelectQuery extends Query {
  /**
   * @param {...(string|Raw)} column
   * @constructor
   * @public
   */
  constructor(...column) {
    super();
    this.type = 'select';
    if (column.length)
      this.columns(...column);
  }

  /**
   *
   * @return {boolean}
   */
  get isSelect() {
    return true;
  }

  /**
   * Adds columns to query.
   *
   * @param {...(string|Raw)} column
   * @return {SelectQuery}
   */
  columns(...column) {
    const self = this;
    this._columns = this._columns || [];
    for (const arg of column) {
      if (!arg) continue;
      if (Array.isArray(arg))
        self.columns(...arg);
      else
        this._columns.push(arg.isSerializable ? arg : new SelectColumn(arg));
    }
    return this;
  }

  /**
   * Defines "from" part of  query.
   *
   * @param {...(string|Raw)} table
   * @return {SelectQuery}
   */
  from(...table) {
    this._tables = [];
    for (const arg of table) {
      if (!arg) continue;
      this._tables.push(
          ['select', 'raw'].indexOf(arg.type) >= 0 ? arg :
              new TableName(String(arg)));
    }
    return this;
  }

  /**
   * Adds "join" statements to query
   *
   * @param {...Join} join
   * @return {SelectQuery}
   */
  join(...join) {
    this._joins = this._joins || [];
    for (const arg of join) {
      if (!arg) continue;
      if (arg.type !== 'join')
        throw new ArgumentError('Join instance required');
      this._joins.push(arg);
    }
    return this;
  }

  /**
   * Defines "where" part of query
   *
   * @param {...(Operator|Object)} operator
   * @return {SelectQuery}
   * @public
   */
  where(...operator) {
    this._where = this._where || new OpAnd();
    this._where.add(...operator);
    return this;
  }

  /**
   * Defines "where" part of query
   *
   * @param {...(Raw|String)} field
   * @return {SelectQuery}
   * @public
   */
  groupBy(...field) {
    this._groupby = [];
    for (const arg of field) {
      if (!arg) continue;
      this._groupby.push(arg.isRaw ? arg : new GroupColumn(String(arg)));
    }
    return this;
  }

  /**
   * Defines "order by" part of query.
   *
   * @param {...(Raw|String)} field
   * @return {SelectQuery}
   * @public
   */
  orderBy(...field) {
    this._orderby = [];
    for (const arg of field) {
      if (!arg) continue;
      this._orderby.push(arg.isRaw ? arg : new OrderColumn(String(arg)));
    }
    return this;
  }

  /**
   * Sets alias for sub-select queries
   *
   * @param {string} alias
   * @return {SelectQuery}
   * @public
   */
  as(alias) {
    this._alias = alias;
    return this;
  }

  /**
   * Sets limit for query
   *
   * @param {Integer} limit
   * @return {SelectQuery}
   * @public
   */
  limit(limit) {
    this._limit = limit;
    return this;
  }

  /**
   * Sets offset for query
   *
   * @param {Integer} offset
   * @return {SelectQuery}
   * @public
   */
  offset(offset) {
    this._offset = offset;
    return this;
  }

  /**
   * Performs serialization
   *
   * @param {Object} ctx
   * @return {string}
   * @override
   */
  _serialize(ctx) {
    super._serialize(ctx);
    const o = {
      columns: this._serializeSelectColumns(ctx),
      from: this._serializeFrom(ctx),
      join: this._serializeJoins(ctx),
      where: this._serializeWhere(ctx),
      groupBy: this._serializeGroupColumns(ctx),
      orderBy: this._serializeOrderColumns(ctx)
    };

    o.limit = this._limit;
    o.offset = this._offset;
    return Serializable.serializeFallback(ctx, 'select_query', o, () => {
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
   * @param {Object} ctx
   * @return {String}
   * @private
   */
  _serializeSelectColumns(ctx) {
    const arr = [];
    if (this._columns)
      for (const t of this._columns) {
        const s = t._serialize(ctx);
        if (s) {
          if (t.isSelect && !t._alias)
            throw new ArgumentError('Alias required for sub-select in columns');
          arr.push(t.isSelect ? '(' + s + ') ' + t._alias : s);
        }
      }
    return Serializable.serializeFallback(ctx, 'select_columns', arr, () => {
      return Serializable.joinArray(arr) || '*';
    });
  }

  /**
   *
   * @param {Object} ctx
   * @return {String}
   * @private
   */
  _serializeFrom(ctx) {
    const arr = [];
    if (this._tables)
      for (const t of this._tables) {
        const s = t._serialize(ctx);
        /* istanbul ignore else */
        if (s) {
          if (t.isSelect && !t._alias)
            throw new ArgumentError('Alias required for sub-select in "from"');
          arr.push(t.isSelect ? '\n\t(' + s + ') ' + t._alias : s);
        }
      }
    return Serializable.serializeFallback(ctx, 'select_from', arr, () => {
      const s = arr.join(',');
      return s ? ('from' + (s.substring(0, 1) !== '\n' ? ' ' : '') + s) : '';
    });
  }

  /**
   *
   * @param {Object} ctx
   * @return {String}
   * @private
   */
  _serializeJoins(ctx) {
    const arr = [];
    if (this._joins)
      for (const t of this._joins) {
        const s = t._serialize(ctx);
        /* istanbul ignore else */
        if (s)
          arr.push(s);
      }
    return Serializable.serializeFallback(ctx, 'joins', arr, () => {
      return arr.join('\n');
    });
  }

  /**
   *
   * @param {Object} ctx
   * @return {String}
   * @private
   */
  _serializeWhere(ctx) {
    if (!this._where)
      return '';
    const s = this._where._serialize(ctx);
    return Serializable.serializeFallback(ctx, 'where', s, () => {
      /* istanbul ignore next */
      return s ? 'where ' + s : '';
    });
  }

  /**
   *
   * @param {Object} ctx
   * @return {String}
   * @private
   */
  _serializeGroupColumns(ctx) {
    const arr = [];
    if (this._groupby)
      for (const t of this._groupby) {
        const s = t._serialize(ctx);
        /* istanbul ignore else */
        if (s)
          arr.push(s);
      }
    return Serializable.serializeFallback(ctx, 'group_columns', arr, () => {
      const s = Serializable.joinArray(arr);
      return s ? 'group by ' + s : '';
    });
  }

  _serializeOrderColumns(ctx) {
    const arr = [];
    if (this._orderby)
      for (const t of this._orderby) {
        const s = t._serialize(ctx);
        /* istanbul ignore else */
        if (s)
          arr.push(s);
      }
    return Serializable.serializeFallback(ctx, 'order_columns', arr, () => {
      const s = Serializable.joinArray(arr);
      return s ? 'order by ' + s : '';
    });
  }

}

/**
 * Expose `SelectQuery`.
 */
module.exports = SelectQuery;
