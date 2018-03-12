/* SQB
 ------------------------
 (c) 2017-present Panates
 SQB may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/sqb/
 */
'use strict';

/* Internal module dependencies. */
const Raw = require('./sqlobject/Raw');
const Join = require('./sqlobject/Join');
const Case = require('./sqlobject/Case');
const types = require('./enums');
const OpAnd = require('./sqlobject/operators/OpAnd');
const OpOr = require('./sqlobject/operators/OpOr');
const OpEq = require('./sqlobject/operators/OpEq');
const OpGt = require('./sqlobject/operators/OpGt');
const OpGte = require('./sqlobject/operators/OpGte');
const OpLt = require('./sqlobject/operators/OpLt');
const OpLte = require('./sqlobject/operators/OpLte');
const OpBetween = require('./sqlobject/operators/OpBetween');
const OpIn = require('./sqlobject/operators/OpIn');
const OpIs = require('./sqlobject/operators/OpIs');
const OpLike = require('./sqlobject/operators/OpLike');
const OpILike = require('./sqlobject/operators/OpILike');
const OpNot = require('./sqlobject/operators/OpNot');
const OpNe = require('./sqlobject/operators/OpNe');
const OpNotBetween = require('./sqlobject/operators/OpNotBetween');
const OpNotIn = require('./sqlobject/operators/OpNotIn');
const OpNotLike = require('./sqlobject/operators/OpNotLike');
const OpNotILike = require('./sqlobject/operators/OpNotILike');

const JoinType = types.JoinType;
const Op = {
  and: function(...args) {
    return new OpAnd(...args);
  },
  or: function(...args) {
    return new OpOr(...args);
  },
  eq: function(...args) {
    return new OpEq(...args);
  },
  gt: function(...args) {
    return new OpGt(...args);
  },
  gte: function(...args) {
    return new OpGte(...args);
  },
  lt: function(...args) {
    return new OpLt(...args);
  },
  lte: function(...args) {
    return new OpLte(...args);
  },
  between: function(...args) {
    return new OpBetween(...args);
  },
  in: function(...args) {
    return new OpIn(...args);
  },
  is: function(...args) {
    return new OpIs(...args);
  },
  like: function(...args) {
    return new OpLike(...args);
  },
  ilike: function(...args) {
    return new OpILike(...args);
  },
  not: function(...args) {
    return new OpNot(...args);
  },
  ne: function(...args) {
    return new OpNe(...args);
  },
  notBetween: function(...args) {
    return new OpNotBetween(...args);
  },
  notIn: function(...args) {
    return new OpNotIn(...args);
  },
  notLike: function(...args) {
    return new OpNotLike(...args);
  },
  notILike: function(...args) {
    return new OpNotILike(...args);
  }
};

/* Operator alternatives */
Object.assign(Op, {
  '=': Op.eq,
  '!=': Op.ne,
  '>': Op.gt,
  '>=': Op.gte,
  '<': Op.lt,
  '<=': Op.lte,
  'btw': Op.between,
  'nbtw': Op.notBetween,
  '!between': Op.notBetween,
  '!btw': Op.notBetween,
  'nin': Op.notIn,
  '!in': Op.notIn,
  'nlike': Op.notLike,
  '!like': Op.notLike,
  'nilike': Op.notILike,
  '!ilike': Op.notILike,
  '!is': Op.not
});

module.exports = {

  Op: Op,

  case: () => {
    return new Case();
  },

  raw: (str) => {
    return new Raw(str);
  },

  join: (table) => {
    return new Join(JoinType.INNER, table);
  },

  innerJoin: (table) => {
    return new Join(JoinType.INNER, table);
  },

  leftJoin: (table) => {
    return new Join(JoinType.LEFT, table);
  },

  leftOuterJoin: (table) => {
    return new Join(JoinType.LEFT_OUTER, table);
  },

  rightJoin: (table) => {
    return new Join(JoinType.RIGHT, table);
  },

  rightOuterJoin: (table) => {
    return new Join(JoinType.RIGHT_OUTER, table);
  },

  outerJoin: (table) => {
    return new Join(JoinType.OUTER, table);
  },

  fullOuterJoin: (table) => {
    return new Join(JoinType.FULL_OUTER, table);
  }

};

Object.assign(module.exports, types);

