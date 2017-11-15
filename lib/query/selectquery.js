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
const ArgumentError = require('errorex').ArgumentError;
const Query = require('./query');
const SqlObject = require('../sqlobjects/sqlobject');
const TableName = require('../sqlobjects/tablename');
const Column = require('../sqlobjects/column');
const Join = require('../sqlobjects/join');
const ConditionGroup = require('../sqlobjects/conditiongroup');
const Order = require('../sqlobjects/order');

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
  this.type = 'select';
  this.clearColumns();
  this.clearJoin();
  this.clearWhere();
  if (column)
    this.columns.apply(this, arguments);
}

SelectQuery.prototype = {
  get isSelect() {
    return this.type === 'select';
  }
};
Object.setPrototypeOf(SelectQuery.prototype, Query.prototype);
SelectQuery.prototype.constructor = SelectQuery;

/**
 *
 * @return {SelectQuery}
 * @public
 */
SelectQuery.prototype.clearColumns = function() {
  this._columns = [];
  return this;
};

/**
 *
 * @return {SelectQuery}
 * @public
 */
SelectQuery.prototype.clearFrom = function() {
  this._tables = [];
  return this;
};

/**
 *
 * @return {SelectQuery}
 * @public
 */
SelectQuery.prototype.clearJoin = function() {
  this._joins = [];
  return this;
};

/**
 *
 * @return {SelectQuery}
 * @public
 */
SelectQuery.prototype.clearGroupBy = function() {
  this._groupby = [];
  return this;
};

/**
 *
 * @return {SelectQuery}
 * @public
 */
SelectQuery.prototype.clearOrderBy = function() {
  this._orderby = [];
  return this;
};

/**
 *
 * @return {SelectQuery}
 * @public
 */
SelectQuery.prototype.clearWhere = function() {
  this._where = new ConditionGroup();
  return this;
};

/**
 *
 * @param {...string|Raw} column
 * @return {SelectQuery}
 */
SelectQuery.prototype.columns = function(column) {
  const self = this;
  var arg;
  for (var i = 0; i < arguments.length; i++) {
    arg = arguments[i];
    if (Array.isArray(arg)) {
      arg.forEach(function(item) {
        self.columns(item);
      });
    } else if (arg)
      this._columns.push(arg instanceof SqlObject ? arg : new Column(arg));
  }
  return this;
};

/**
 *
 * @param {...string|Raw} table
 * @return {SelectQuery}
 */
SelectQuery.prototype.from = function(table) {
  this.clearFrom();
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
  for (var i = 0; i < arguments.length; i++) {
    arg = arguments[i];
    if (arg instanceof Join)
      this._joins.push(arg);
    else if (arg)
      throw new ArgumentError('Invalid argument in method "join"');
  }
  return this;
};

/**
 *
 * @param {...*} condition
 * @return {SelectQuery}
 * @public
 */
SelectQuery.prototype.where = function(condition) {
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
  this.clearGroupBy();
  var arg;
  for (var i = 0; i < arguments.length; i++) {
    arg = arguments[i];
    if (arg)
      this._groupby.push(arg.isRaw ? arg : new Column(String(arg)));
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
  this.clearOrderBy();
  var arg;
  for (var i = 0; i < arguments.length; i++) {
    arg = arguments[i];
    if (arg)
      this._orderby.push(arg.isRaw ? arg : new Order(String(arg)));
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

/**
 *
 * @param {Function} callback
 * @return {SelectQuery}
 */
SelectQuery.prototype.onFetchRow = function(callback) {
  if (!callback) return this;
  if (typeof callback !== 'function')
    throw new ArgumentError('Invalid argument. Function type required');
  this._onFetchRow = this._onFetchRow = [];
  this._onFetchRow.push(callback);
  return this;
};
