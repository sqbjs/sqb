/* SQB
 ------------------------
 (c) 2017-present Panates
 SQB may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/sqb/
 */

/* Internal module dependencies. */

const SqlObject = require('./abstract');
const ConditionGroup = require('./conditiongroup');

/**
 * @class
 * @public
 */

class Case extends SqlObject {

  constructor() {
    super();
    this.type = 'case';
    this._expressions = [];
  }

  when(...conditions) {
    if (conditions.length > 0) {
      this._condition = new ConditionGroup(...conditions);
    }
    return this;
  }

  then(value) {
    this._expressions.push({
      condition: this._condition,
      value,
    });
    return this;
  }

  as(alias) {
    this._alias = alias;
    return this;
  }

  //noinspection ReservedWordAsName
  else(value) {
    this._elseValue = value;
    return this;
  }
}

module.exports = Case;
