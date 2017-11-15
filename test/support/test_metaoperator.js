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

/**
 * @param {String} tableName
 * @return {String}
 * @protected
 */
proto.getSelectSql = function(tableName) {
  switch (tableName) {
    case 'schemas':
      return 'schemas';
    case 'tables':
      return 'tables';
    case 'columns':
      return 'columns';
    case 'primary_keys':
      return 'primary_keys';
    case 'foreign_keys':
      return 'foreign_keys';
  }
  throw new Error('Unknown meta-data table `' + tableName + '`');
};
