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
const {ArgumentError} = require('errorex');
const Serializable = require('../Serializable');
const TableName = require('./TableName');
const OpAnd = require('../sqlobject/operators/OpAnd');

/**
 *
 * @class
 */
class Join extends Serializable {
  /**
   * @param {String} joinType
   * @param {String} table
   * @constructor
   * @public
   */
  constructor(joinType, table) {
    super();
    if (!table || !(typeof table === 'string' || table.isSelect || table.isRaw))
      throw new ArgumentError('Table name, select query or raw object required for Join');
    this.type = 'join';
    this.joinType = joinType;
    this.table = table.isSelect || table.isRaw ? table :
        new TableName(String(table));
  }

  /**
   * Defines "on" part of Join expression.
   *
   * @param {...(Operator|Object)} conditions
   * @return {Join}
   * @public
   */
  on(...conditions) {
    this._conditions = this._conditions || new OpAnd();
    this._conditions.add(...conditions);
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
    const o = {
      joinType: this.joinType,
      table: this.table._serialize(ctx),
      conditions: this._serializeConditions(this, ctx)
    };
    return Serializable.serializeFallback(ctx, 'join', o, () => {
      let out;
      switch (this.joinType) {
        case 1:
          out = 'left join';
          break;
        case 2:
          out = 'left outer join';
          break;
        case 3:
          out = 'right join';
          break;
        case 4:
          out = 'right outer join';
          break;
        case 5:
          out = 'outer join';
          break;
        case 6:
          out = 'full outer join';
          break;
        default:
          out = 'inner join';
          break;
      }
      const lf = o.table.length > 40;
      if (this.table.type === 'select') {
        if (!this.table._alias)
          throw new ArgumentError('Alias required for sub-select in Join');
        out += ' (' + (lf ? '\n\t' : '') + o.table + (lf ? '\n\b' : '') + ')' +
            ' ' + this.table._alias;
      } else
        out += ' ' + o.table;

      if (o.conditions)
        out += ' ' + o.conditions;

      return out + (lf ? '\b' : '');
    });
  }

  /**
   *
   * @param {Object} query
   * @param {Object} ctx
   * @return {string}
   * @private
   */
  _serializeConditions(query, ctx) {
    if (query._conditions) {
      const s = query._conditions._serialize(ctx);
      return Serializable.serializeFallback(ctx, 'join_conditions', s, () => {
        return s ? 'on ' + s : '';
      });
    }
    return '';
  }

}

/**
 * Expose `Join`.
 */
module.exports = Join;
