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
const ArgumentError = require('errorex').ArgumentError;
const Serializable = require('../Serializable');
const ReturningQuery = require('./ReturningQuery');
const TableName = require('../sqlobject/TableName');
const OpAnd = require('../sqlobject/operators/OpAnd');

/**
 *
 * @class
 */
class UpdateQuery extends ReturningQuery {
  /**
   * @param {String} tableName
   * @param {Object} values
   * @constructor
   * @public
   */
  constructor(tableName, values) {
    super();
    this.type = 'update';
    this._values = {};
    if (!tableName || !(typeof tableName === 'string' || tableName.isRaw))
      throw new ArgumentError('String or Raw instance required as first argument (tableName) for UpdateQuery');
    if (!values || !((typeof values === 'object' && !Array.isArray(values)) ||
            values.isSelect))
      throw new ArgumentError('Object or Raw instance required as second argument (values) for UpdateQuery');
    this._table = tableName.isRaw ? tableName : new TableName(tableName);
    this._values = values;
  }

  /**
   *
   * @return {boolean}
   */
  get isUpdate() {
    return true;
  }

  /**
   *
   * @param {...(Operator|Object)} operator
   * @return {UpdateQuery}
   * @public
   */
  where(...operator) {
    this._where = this._where || new OpAnd();
    this._where.add(...operator);
    return this;
  }

  /**
   *
   * @param {Object} ctx
   * @return {string}
   * @override
   */
  _serialize(ctx) {
    super._serialize(ctx);
    const o = {
      table: this._table._serialize(ctx),
      values: this._serializeValues(ctx),
      where: this._serializeWhere(ctx),
      returning: this._serializeReturning(ctx)
    };
    let out = 'update ' + o.table + ' set \n\t' + o.values + '\b';
    if (o.where)
      out += '\n' + o.where;
    if (o.returning)
      out += '\nreturning ' + o.returning;
    return out;
  }

  /**
   *
   * @param {Object} ctx
   * @return {string}
   * @private
   */
  _serializeValues(ctx) {
    const arr = [];
    const allValues = this._values;
    Object.getOwnPropertyNames(allValues).forEach((n) => {
      arr.push({
        field: n,
        value: Serializable.serializeObject(ctx, allValues[n])
      });
    });
    return Serializable.serializeFallback(ctx, 'update_values', arr, () => {
      arr.forEach((o, i) => {
        arr[i] = o.field + ' = ' + o.value;
      });
      return Serializable.joinArray(arr, ',');
    });
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
 * Expose `UpdateQuery`.
 */
module.exports = UpdateQuery;
