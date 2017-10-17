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
const Query = require('./query');
const Table = require('../sqlobjects/tablename');
const ConditionGroup = require('../sqlobjects/conditiongroup');

/**
 * Expose `DeleteQuery`.
 */
module.exports = DeleteQuery;

/**
 * @param {String} table
 * @constructor
 * @public
 */
function DeleteQuery(table) {
  Query.call(this);
  this.type = 'delete';
  this.clearFrom();
  this.clearWhere();
  this.from(table);
}

const proto = DeleteQuery.prototype = {};
Object.setPrototypeOf(proto, Query.prototype);
proto.constructor = DeleteQuery;

/**
 *
 * @return {DeleteQuery}
 * @public
 */
proto.clearFrom = function() {
  this._tables = [];
  return this;
};

/**
 *
 * @return {DeleteQuery}
 * @public
 */
proto.clearWhere = function() {
  this._where = new ConditionGroup();
  return this;
};

/**
 *
 * @param {...string|Raw} table
 * @return {DeleteQuery}
 */
proto.from = function(table) {
  if (table) {
    this._table = table.isRaw ? table : new Table(String(table));
  }
  return this;
};

/**
 *
 * @param {...Condition} condition
 * @return {DeleteQuery}
 * @public
 */
proto.where = function(condition) {
  this._where.add.apply(this._where, arguments);
  return this;
};
