/* sqb-connect-oracle
 ------------------------
 (c) 2017-present Panates
 SQB may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/sqb-connect-oracle/
 */

/**
 * Expose `TestMetaOperator`.
 */
module.exports = TestMetaOperator;

/**
 * @constructor
 */
function TestMetaOperator() {
}

const proto = TestMetaOperator.prototype = {};
proto.constructor = TestMetaOperator;

proto.query = function(sqbObj, request, callback) {
  callback(undefined, request);
};
