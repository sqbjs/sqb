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
const Condition = require('./Condition');

/**
 * Expose `ConditionGroup`.
 */
module.exports = ConditionGroup;

/**
 * @param {...*} src
 * @constructor
 * @public
 */
function ConditionGroup(src) {
  SqlObject.call(this);
  this.type = 'conditiongroup';
  this._items = [];
  this.logicalOperator = 'and';
  if (arguments.length > 0)
    this.add.apply(this, arguments);
}

ConditionGroup.prototype = {
  get length() {
    return this._items.length;
  }
};
Object.setPrototypeOf(ConditionGroup.prototype, SqlObject.prototype);
ConditionGroup.prototype.constructor = ConditionGroup;

/**
 *
 * @param {...SqlObject|string} item
 * @return {ConditionGroup}
 */
ConditionGroup.prototype.add = function(item) {
  if (!(item && arguments.length)) return this;
  var c;
  const self = this;
  if (typeof arguments[0] === 'string') {
    c = Object.create(Condition.prototype);
    Condition.apply(c, arguments);
    self._items.push(c);
    return self;
  }

  var logop = self.logicalOperator;
  var arg;
  for (var i = 0; i < arguments.length; i++) {
    arg = arguments[i];
    // Process array argument
    if (Array.isArray(arg)) {
      if (arg.length) {
        // if First item is array, it is a group
        if (Array.isArray(arg[0])) {
          c = Object.create(ConditionGroup.prototype);
          ConditionGroup.apply(c, arg);
          c.logicalOperator = logop;
          self._items.push(c);
        } else {
          c = Object.create(Condition.prototype);
          Condition.apply(c, arg);
          c.logicalOperator = logop;
          self._items.push(c);
        }
      }
    } else if (typeof arg === 'string' &&
        ConditionGroup.LogicalOperators.indexOf(arg.toLowerCase()) >= 0) {
      logop = arg;
    } else if (arg && arg.type === 'raw') {
      arg.logicalOperator = logop;
      self._items.push(arg);
    } else if (arg != null)
      throw new TypeError('Invalid argument');
  }
};

ConditionGroup.prototype.item = function(index) {
  return this._items[index];
};

ConditionGroup.LogicalOperators = ['and', 'or', 'not'];
