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
const Serializable = require('../Serializable');
const TableName = require('./TableName');
const OpAnd = require('../sqlobject/operators/OpAnd');

/**
 * Expose `Join`.
 */
module.exports = Join;

/**
 * @param {String} joinType
 * @param {String} table
 * @constructor
 * @public
 */
function Join(joinType, table) {
  Serializable.call(this);
  if (!table || !(typeof table === 'string' || table.isSelect || table.isRaw))
    throw new ArgumentError('Table name, select query or raw object required for Join');
  this.type = 'join';
  this.joinType = joinType;
  this.table = table.isSelect || table.isRaw ? table :
      new TableName(String(table));
}

Join.prototype = {
  get isJoin() {
    return true;
  }
};
Join.prototype.constructor = Join;
Object.setPrototypeOf(Join.prototype, Serializable.prototype);

Join.prototype.on = function(conditions) {
  this._conditions = this._conditions || new OpAnd();
  this._conditions.add.apply(this._conditions, arguments);
  return this;
};

Join.prototype._serialize = function(ctx) {
  const self = this;
  const o = {
    joinType: this.joinType,
    table: this.table._serialize(ctx),
    conditions: serializeConditions(this, ctx)
  };
  return Serializable.serializeFallback(ctx, 'join', o, function() {
    var out;
    switch (self.joinType) {
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
    if (self.table.type === 'select') {
      if (!self.table._alias)
        throw new ArgumentError('Alias required for sub-select in Join');
      out += ' (' + (lf ? '\n\t' : '') + o.table + (lf ? '\n\b' : '') + ')' +
          ' ' + self.table._alias;
    } else
      out += ' ' + o.table;

    if (o.conditions)
      out += ' ' + o.conditions;

    return out + (lf ? '\b' : '');
  });
};

function serializeConditions(query, ctx) {
  if (query._conditions) {
    const s = query._conditions._serialize(ctx);
    return Serializable.serializeFallback(ctx, 'join_conditions', s, function() {
      return s ? 'on ' + s : '';
    });
  }
  return '';
}
