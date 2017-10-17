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
const ReturningQuery = require('./returningquery');
const Table = require('../sqlobjects/tablename');
const ConditionGroup = require('../sqlobjects/conditiongroup');

/**
 * Expose `UpdateQuery`.
 */
module.exports = UpdateQuery;

/**
 * @param {String} table
 * @param {*} values
 * @constructor
 * @public
 */
function UpdateQuery(table, values) {
  ReturningQuery.call(this);
  this.type = 'update';
  this._values = {};
  this._table = table.isRaw ? table : new Table(String(table));
  this.set(values);
  this.clearWhere();
}

const proto = UpdateQuery.prototype = {};
Object.setPrototypeOf(proto, ReturningQuery.prototype);
proto.constructor = UpdateQuery;

/**
 *
 * @return {UpdateQuery}
 * @public
 */
proto.clearWhere = function() {
  this._where = new ConditionGroup();
  return this;
};

/**
 *
 * @param {Object|Raw} values
 * @return {UpdateQuery}
 * @public
 */
proto.set = function(values) {
  if (!values) return this;
  if (values.isRaw)
    this._values = values;
  else if (typeof values === 'object') {
    // We build a new map of upper keys for case insensitivity
    const out = {};
    Object.getOwnPropertyNames(values).forEach(
        function(key) {
          out[key] = values[key];
        }
    );
    this._values = out;
  } else throw new TypeError('Invalid argument');
  return this;
};

/**
 *
 * @param {...Condition} condition
 * @return {UpdateQuery}
 * @public
 */
proto.where = function(condition) {
  this._where.add.apply(this._where, arguments);
  return this;
};
