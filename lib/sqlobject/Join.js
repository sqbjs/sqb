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
const SqlObject = require('./SqlObject');
const ConditionGroup = require('./ConditionGroup');
const TableName = require('./TableName');

/**
 * Expose `Join`.
 */
module.exports = Join;

/**
 * @param {String} joinType
 * @param {String} table
 * @constructor
 * @public
 */
function Join(joinType, table) {
  SqlObject.call(this);
  if (joinType < 0 || joinType > 6)
    throw new ArgumentError('Invalid value (%s) for `joinType` argument', joinType);
  if (!(typeof table === 'string' || table.isSelect || table.isRaw))
    throw new ArgumentError('Invalid type (%s) for `table` argument', table);
  this.type = 'join';
  this.joinType = joinType;
  this.table = table.isSelect || table.isRaw ?
      table :
      new TableName(String(table));
  this.conditions = new ConditionGroup();
}

Object.setPrototypeOf(Join.prototype, SqlObject.prototype);

Join.prototype.on = function(conditions) {
  this.conditions.add.apply(this.conditions, arguments);
  return this;
};


