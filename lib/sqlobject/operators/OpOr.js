/* SQB
 ------------------------
 (c) 2017-present Panates
 SQB may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/sqb/
 */
'use strict';

/**
 * Module dependencies.
 * @private
 */
const LogicalOperator = require('./LogicalOperator');

/**
 *
 * @class
 */
class OpOr extends LogicalOperator {

  /**
   * @param {...Operator} operator
   * @constructor
   * @public
   */
  constructor(...operator) {
    super(...operator);
  }

  /**
   * Returns operator type
   *
   * @public
   * @return {string}
   */
  get operatorType() {
    return 'or';
  }

}

/**
 * Expose `OpOr`.
 */
module.exports = OpOr;
