/* SQB
 ------------------------
 (c) 2017-present Panates
 SQB may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/sqb/
 */

/**
 * Module dependencies.
 * @private
 */
const EventEmitter = require('events').EventEmitter;
const ArgumentError = require('errorex').ArgumentError;
const Query = require('./Query');
const Serializable = require('../Serializable');
const TableName = require('../sqlobject/TableName');
const TableColumn = require('../sqlobject/TableColumn');
const OrderColumn = require('../sqlobject/OrderColumn');
const GroupColumn = require('../sqlobject/GroupColumn');
const OpAnd = require('../sqlobject/operators/OpAnd');
const merge = require('putil-merge');

/**
 * Expose `SelectQuery`.
 */
module.exports = SelectQuery;

/**
 * @param {...*} column
 * @constructor
 * @public
 */
function SelectQuery(column) {
  Query.call(this);
  EventEmitter.call(this);
  this.type = 'select';
  if (column)
    this.columns.apply(this, arguments);
}

SelectQuery.prototype = {
  get isSelect() {
    return true;
  }
};
Object.setPrototypeOf(SelectQuery.prototype, Query.prototype);
merge.descriptor(SelectQuery.prototype, EventEmitter.prototype);
SelectQuery.prototype.constructor = SelectQuery;

/**
 *
 * @param {...string|Raw} column
 * @return {SelectQuery}
 */
SelectQuery.prototype.columns = function(column) {
  const self = this;
  this._columns = this._columns || [];
  var arg;
  for (var i = 0; i < arguments.length; i++) {
    arg = arguments[i];
    if (Array.isArray(arg))
      self.columns.apply(self, arg);
    else if (arg) {
      this._columns.push(arg.isSerializable ? arg : new TableColumn(arg));
    }
  }
  return this;
};

/**
 *
 * @param {...string|Raw} table
 * @return {SelectQuery}
 */
SelectQuery.prototype.from = function(table) {
  this._tables = [];
  var arg;
  for (var i = 0; i < arguments.length; i++) {
    arg = arguments[i];
    if (arg)
      this._tables.push(
          arg.isSelect || arg.isRaw ? arg : new TableName(String(arg)));
  }
  return this;
};

/**
 *
 * @param {...Join} join
 * @return {SelectQuery}
 */
SelectQuery.prototype.join = function(join) {
  var arg;
  this._joins = this._joins || [];
  for (var i = 0; i < arguments.length; i++) {
    arg = arguments[i];
    if (!arg) continue;
    if (!arg.isJoin)
      throw new ArgumentError('Join instance required');
    this._joins.push(arg);
  }
  return this;
};

/**
 *
 * @param {...Operator} operator
 * @return {SelectQuery}
 * @public
 */
SelectQuery.prototype.where = function(operator) {
  this._where = this._where || new OpAnd();
  this._where.add.apply(this._where, arguments);
  return this;
};

/**
 *
 * @param {...Raw|String} field
 * @return {SelectQuery}
 * @public
 */
SelectQuery.prototype.groupBy = function(field) {
  this._groupby = [];
  var arg;
  for (var i = 0; i < arguments.length; i++) {
    arg = arguments[i];
    if (arg)
      this._groupby.push(arg.isRaw ? arg : new GroupColumn(String(arg)));
  }
  return this;
};

/**
 *
 * @param {...Raw|String} field
 * @return {SelectQuery}
 * @public
 */
SelectQuery.prototype.orderBy = function(field) {
  this._orderby = [];
  var arg;
  for (var i = 0; i < arguments.length; i++) {
    arg = arguments[i];
    if (arg)
      this._orderby.push(arg.isRaw ? arg : new OrderColumn(String(arg)));
  }
  return this;
};

/**
 *
 * @param {string} alias
 * @return {SelectQuery}
 * @public
 */
SelectQuery.prototype.as = function(alias) {
  this._alias = alias;
  return this;
};

/**
 *
 * @param {int} limit
 * @return {SelectQuery}
 * @public
 */
SelectQuery.prototype.limit = function(limit) {
  this._limit = limit;
  return this;
};

/**
 *
 * @param {int} offset
 * @return {SelectQuery}
 * @public
 */
SelectQuery.prototype.offset = function(offset) {
  this._offset = offset;
  return this;
};

SelectQuery.prototype._serialize = function(ctx) {
  /* Call super */
  Query.prototype._serialize.call(ctx);

  const o = {
    columns: serializeTableColumns(this, ctx),
    from: serializeFrom(this, ctx),
    join: serializeJoins(this, ctx),
    where: serializeWhere(this, ctx),
    groupBy: serializeGroupColumns(this, ctx),
    orderBy: serializeOrderColumns(this, ctx)
  };

  o.limit = this._limit;
  o.offset = this._offset;
  return Serializable.serializeFallback(ctx, 'select_query', o, function() {
    var out = 'select';
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
};

function serializeTableColumns(query, ctx) {
  const arr = [];
  if (query._columns)
    query._columns.forEach(function(t) {
      const s = t._serialize(ctx);
      if (s) {
        if (t.isSelect && !t._alias)
          throw new ArgumentError('Alias required for sub-select in columns');
        arr.push(t.isSelect ? '(' + s + ') ' + t._alias : s);
      }
    });
  return Serializable.serializeFallback(ctx, 'select_columns', arr, function() {
    return Serializable.joinArray(arr) || '*';
  });
}

function serializeFrom(query, ctx) {
  const arr = [];
  if (query._tables)
    query._tables.forEach(function(t) {
      const s = t._serialize(ctx);
      /* istanbul ignore else */
      if (s) {
        if (t.isSelect && !t._alias)
          throw new ArgumentError('Alias required for sub-select in "from"');
        arr.push(t.isSelect ? '\n\t(' + s + ') ' + t._alias : s);
      }
    });
  return Serializable.serializeFallback(ctx, 'select_from', arr, function() {
    const s = arr.join(',');
    return s ? ('from' + (s.substring(0, 1) !== '\n' ? ' ' : '') + s) : '';
  });
}

function serializeJoins(query, ctx) {
  const arr = [];
  if (query._joins)
    query._joins.forEach(function(t) {
      const s = t._serialize(ctx);
      /* istanbul ignore else */
      if (s)
        arr.push(s);
    });
  return Serializable.serializeFallback(ctx, 'joins', arr, function() {
    return arr.join('\n');
  });
}

function serializeWhere(query, ctx) {
  if (!query._where)
    return '';
  const s = query._where._serialize(ctx);
  return Serializable.serializeFallback(ctx, 'where', s, function() {
    /* istanbul ignore next */
    return s ? 'where ' + s : '';
  });
}

function serializeGroupColumns(query, ctx) {
  const arr = [];
  if (query._groupby)
    query._groupby.forEach(function(t) {
      const s = t._serialize(ctx);
      /* istanbul ignore else */
      if (s)
        arr.push(s);
    });
  return Serializable.serializeFallback(ctx, 'group_columns', arr, function() {
    const s = Serializable.joinArray(arr);
    return s ? 'group by ' + s : '';
  });
}

function serializeOrderColumns(query, ctx) {
  const arr = [];
  if (query._orderby)
    query._orderby.forEach(function(t) {
      const s = t._serialize(ctx);
      /* istanbul ignore else */
      if (s)
        arr.push(s);
    });
  return Serializable.serializeFallback(ctx, 'order_columns', arr, function() {
    const s = Serializable.joinArray(arr);
    return s ? 'order by ' + s : '';
  });
}
