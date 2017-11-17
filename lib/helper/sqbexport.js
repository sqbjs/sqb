/* SQB
 ------------------------
 (c) 2017-present Panates
 SQB may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/sqb/
 */

/* Internal module dependencies. */
const Raw = require('../sqlobject/Raw');
const Join = require('../sqlobject/Join');
const Case = require('../sqlobject/Case');
const types = require('../types');

const JoinType = types.JoinType;

module.exports = {

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
  },

  case: function() {
    return new Case();
  }

};

Object.assign(module.exports, types);