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
const SqlObject = require('./SqlObject');
const ConditionGroup = require('./ConditionGroup');

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

Object.setPrototypeOf(Case.prototype, SqlObject.prototype);

Case.prototype.when = function(condition) {
  if (condition && arguments.length) {
    this._condition = Object.create(ConditionGroup.prototype);
    ConditionGroup.apply(this._condition, arguments);
  } else this._condition = null;
  return this;
};

Case.prototype.then = function(value) {
  if (this._condition)
    this._expressions.push({
      condition: this._condition,
      value: value || null
    });
  return this;
};

Case.prototype.as = function(alias) {
  this._alias = alias;
  return this;
};

Case.prototype.else = function(value) {
  this._elseValue = value;
  return this;
};
