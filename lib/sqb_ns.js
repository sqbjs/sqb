/* SQB
 ------------------------
 (c) 2017-present Panates
 SQB may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/sqb/
 */

/* Internal module dependencies. */
const Raw = require('./sqlobject/Raw');
const Join = require('./sqlobject/Join');
const Case = require('./sqlobject/Case');
const types = require('./enums');

const JoinType = types.JoinType;
const Op = {
  and: function() {
    return construct(require('./sqlobject/operators/OpAnd'), arguments);
  },
  or: function() {
    return construct(require('./sqlobject/operators/OpOr'), arguments);
  },
  eq: function() {
    return construct(require('./sqlobject/operators/OpEq'), arguments);
  },
  gt: function() {
    return construct(require('./sqlobject/operators/OpGt'), arguments);
  },
  gte: function() {
    return construct(require('./sqlobject/operators/OpGte'), arguments);
  },
  lt: function() {
    return construct(require('./sqlobject/operators/OpLt'), arguments);
  },
  lte: function() {
    return construct(require('./sqlobject/operators/OpLte'), arguments);
  },
  between: function() {
    return construct(require('./sqlobject/operators/OpBetween'), arguments);
  },
  in: function() {
    return construct(require('./sqlobject/operators/OpIn'), arguments);
  },
  is: function() {
    return construct(require('./sqlobject/operators/OpIs'), arguments);
  },
  like: function() {
    return construct(require('./sqlobject/operators/OpLike'), arguments);
  },
  ilike: function() {
    return construct(require('./sqlobject/operators/OpILike'), arguments);
  },
  not: function() {
    return construct(require('./sqlobject/operators/OpNot'), arguments);
  },
  ne: function() {
    return construct(require('./sqlobject/operators/OpNe'), arguments);
  },
  notBetween: function() {
    return construct(require('./sqlobject/operators/OpNotBetween'), arguments);
  },
  notIn: function() {
    return construct(require('./sqlobject/operators/OpNotIn'), arguments);
  },
  notLike: function() {
    return construct(require('./sqlobject/operators/OpNotLike'), arguments);
  },
  notILike: function() {
    return construct(require('./sqlobject/operators/OpNotILike'), arguments);
  }
};

/* Operator alternatives */
Object.assign(Op, {
  'btw': Op.between,
  'nbtw': Op.notBetween,
  'nin': Op.notIn,
  'nlike': Op.notLike,
  'nilike': Op.notILike,
  '=': Op.eq,
  '!=': Op.ne,
  '>': Op.gt,
  '>=': Op.gte,
  '<': Op.lt,
  '<=': Op.lte,
  '!like': Op.notLike,
  '!ilike': Op.notILike,
  '!is': Op.not,
  '!in': Op.notIn
});

module.exports = {

  Op: Op,

  case: function() {
    return new Case();
  },

  raw: function(str) {
    return new Raw(str);
  },

  join: function(table) {
    return new Join(JoinType.INNER, table);
  },

  innerJoin: function(table) {
    return new Join(JoinType.INNER, table);
  },

  leftJoin: function(table) {
    return new Join(JoinType.LEFT, table);
  },

  leftOuterJoin: function(table) {
    return new Join(JoinType.LEFT_OUTER, table);
  },

  rightJoin: function(table) {
    return new Join(JoinType.RIGHT, table);
  },

  rightOuterJoin: function(table) {
    return new Join(JoinType.RIGHT_OUTER, table);
  },

  outerJoin: function(table) {
    return new Join(JoinType.OUTER, table);
  },

  fullOuterJoin: function(table) {
    return new Join(JoinType.FULL_OUTER, table);
  }

};

Object.assign(module.exports, types);

function construct(clazz, args) {
  const inst = Object.create(clazz.prototype);
  clazz.apply(inst, args);
  return inst;
}
