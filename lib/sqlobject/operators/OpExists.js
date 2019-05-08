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
const Serializable = require('../../Serializable');
const Operator = require('../Operator');
const {TypeError} = require('errorex');

class OpExists extends Operator {

  /**
   * @constructor
   * @param {SelectQuery} query
   * @public
   */
  constructor(query) {
    super();
    this._operatorType = 'exists';
    this._query = query;
    if (!(query instanceof require('../../query/SelectQuery')))
      throw new TypeError('You must provide a SelectQuery in `exists()`');
  }

  /**
   * Performs serialization
   *
   * @param {Object} ctx
   * @return {string}
   * @override
   */
  _serialize(ctx) {
    const query = Serializable.serializeObject(ctx, this._query);
    const q = {
      query
    };
    return Serializable.serializeFallback(ctx, 'exists_expression', q, () => {
      return q.query ? 'exists ' + query : '';
    });
  }

}

/**
 * Expose `OpExists`.
 */
module.exports = OpExists;
