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
const Condition = require('./condition');

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

const proto = ConditionGroup.prototype = {
  get length() {
    return this._items.length;
  }
};
Object.setPrototypeOf(proto, SqlObject.prototype);
proto.constructor = ConditionGroup;

/**
 *
 * @param {...SqlObject|string} item
 * @return {ConditionGroup}
 */
proto.add = function(item) {
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
        } else if (typeof arg[0] === 'string' || (
                ['select', 'raw'].indexOf(arg[0].type) >= 0)) {
          c = Object.create(Condition.prototype);
          Condition.apply(c, arg);
          c.logicalOperator = logop;
          self._items.push(c);
        } else throw new TypeError('Invalid argument');
      }
    } else if (arg === 'and' || arg === 'or') {
      logop = arg;
    } else if (arg.type === 'raw') {
      //noinspection JSUndefinedPropertyAssignment
      arg.logicalOperator = logop;
      self._items.push(arg);
    } else if (arg)
      throw new TypeError('Invalid argument');
  }
};

proto.item = function(index) {
  return this._items[index];
};
