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

/**
 *
 * @class
 */
class InsertQuery extends ReturningQuery {
  /**
   * @param {string|Raw} tableName
   * @param {Object} input
   * @constructor
   * @public
   */
  constructor(tableName, input) {
    super();
    this.type = 'insert';
    if (!tableName || !(typeof tableName === 'string' || tableName.isRaw))
      throw new ArgumentError('String or Raw instance required as first argument (tableName) for InsertQuery');
    if (!input || !((typeof input === 'object' && !Array.isArray(input)) ||
        input.isSelect))
      throw new ArgumentError('Object or SelectQuery instance required as second argument (input) for InsertQuery');
    this._table = tableName.isRaw ? tableName : new TableName(tableName);
    this._input = input;
  }

  /**
   *
   * @return {boolean}
   */
  get isInsert() {
    return true;
  }

  /**
   * Performs serialization
   *
   * @param {Object} ctx
   * @return {string}
   * @override
   */
  _serialize(ctx) {
    super._serialize(ctx);
    const o = {
      table: this._table._serialize(ctx),
      columns: this._serializeColumns(ctx),
      values: this._serializeValues(ctx),
      returning: this._serializeReturning(ctx)
    };

    let out = 'insert into ' + o.table + '\n\t(' +
        o.columns + ')\n\bvalues\n\t(' + o.values + ')\b';
    if (o.returning)
      out += '\nreturning ' + o.returning;
    return out;
  }

  /**
   *
   * @param {Object} ctx
   * @return {String}
   * @private
   */
  _serializeColumns(ctx) {
    let arr;
    if (this._input.isSelect) {
      arr = [];
      const cols = this._input._columns;
      for (const col of cols) {
        arr.push(col.alias || col.field);
      }
    } else
      arr = Object.keys(this._input);
    return Serializable.serializeFallback(ctx, 'insert_columns', arr, () => {
      return Serializable.joinArray(arr);
    });
  }

  /**
   *
   * @param {Object} ctx
   * @return {String}
   * @private
   */
  _serializeValues(ctx) {
    if (this._input.isSerializable)
      return this._input._serialize(ctx);

    const arr = [];
    const allValues = this._input;
    for (const n of Object.keys(allValues)) {
      arr.push(Serializable.serializeObject(ctx, allValues[n]));
    }
    return Serializable.serializeFallback(ctx, 'insert_input', arr, () => {
      return Serializable.joinArray(arr);
    });
  }

}

/**
 * Expose `InsertQuery`.
 */

module.exports = InsertQuery;
