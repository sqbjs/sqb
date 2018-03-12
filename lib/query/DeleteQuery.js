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
const ArgumentError = require('errorex').ArgumentError;
const Query = require('./Query');
const Serializable = require('../Serializable');
const TableName = require('../sqlobject/TableName');
const OpAnd = require('../sqlobject/operators/OpAnd');

/**
 *
 * @class
 */
class DeleteQuery extends Query {
  /**
   * @param {String} tableName
   * @constructor
   * @public
   */
  constructor(tableName) {
    super();
    this.type = 'delete';
    if (!tableName || !(typeof tableName === 'string' || tableName.isRaw))
      throw new ArgumentError('String or Raw instance required as first argument (tableName) for UpdateQuery');
    this._table = tableName.isRaw ? tableName : new TableName(tableName);
  }

  /**
   *
   * @return {boolean}
   */
  get isDelete() {
    return true;
  }

  /**
   * Defines "where" part of query
   *
   * @param {...(Operator|Object)} operator
   * @return {SelectQuery}
   * @public
   */
  where(...operator) {
    this._where = this._where || new OpAnd();
    this._where.add(...operator);
    return this;
  }

  /**
   * Performs serialization
   *
   * @param {Object} ctx
   * @return {string}
   * @override
   */
  _serialize(ctx) {
    super._serialize.call(ctx);
    const o = {
      table: this._table._serialize(ctx),
      where: this._serializeWhere(ctx)
    };
    let out = 'delete from ' + o.table;
    if (o.where)
      out += '\n' + o.where;
    return out;
  }

  /**
   *
   * @param {Object} ctx
   * @return {string}
   * @private
   */
  _serializeWhere(ctx) {
    if (!this._where)
      return '';
    const s = this._where._serialize(ctx);
    return Serializable.serializeFallback(ctx, 'where', s, () => {
      /* istanbul ignore next */
      return s ? 'where ' + s : '';
    });

  }

}

/**
 * Expose `DeleteQuery`.
 */
module.exports = DeleteQuery;

