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
const SqlObject = require('./sqlobject');
const ConditionGroup = require('./conditiongroup');

/**
 * Expose `Case`.
 */
module.exports = Case;

/**
 * @constructor
 * @public
 */
function Case() {
  SqlObject.call(this);
  this.type = 'case';
  this._expressions = [];
}

const proto = Case.prototype = {};
Object.setPrototypeOf(proto, SqlObject.prototype);
proto.constructor = Case;

proto.when = function(condition) {
  if (condition && arguments.length) {
    this._condition = Object.create(ConditionGroup.prototype);
    ConditionGroup.apply(this._condition, arguments);
  } else this._condition = null;
  return this;
};

proto.then = function(value) {
  if (this._condition)
    this._expressions.push({
      condition: this._condition,
      value: value || null
    });
  return this;
};

proto.as = function(alias) {
  this._alias = alias;
  return this;
};

//noinspection ReservedWordAsName
proto.else = function(value) {
  this._elseValue = value;
  return this;
};
