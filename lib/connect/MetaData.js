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

const MetaDataSelect = require('./MetaDataSelect');

/**
 * Expose `MetaData`.
 */

module.exports = MetaData;

/**
 * @param {Pool|Connection} dbobj
 * @param {Object} metaOperator
 * @constructor
 */
function MetaData(dbobj, metaOperator) {
  if (!metaOperator)
    throw new Error('Database wrapper plugin does not support metaData operations');
  this.dbobj = dbobj;
  this._metaOperator = metaOperator;
}

MetaData.prototype.select = function(column) {
  const o = Object.create(MetaDataSelect.prototype);
  const args = [this].concat(Array.prototype.slice.call(arguments));
  MetaDataSelect.apply(o, args);
  return o;
};
