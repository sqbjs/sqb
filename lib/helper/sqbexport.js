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

module.exports = {

  raw: function(str) {
    return new Raw(str);
  },

  join: function(table) {
    return new Join(Join.Type.innerJoin, table);
  },

  innerJoin: function(table) {
    return new Join(Join.Type.innerJoin, table);
  },

  leftJoin: function(table) {
    return new Join(Join.Type.leftJoin, table);
  },

  leftOuterJoin: function(table) {
    return new Join(Join.Type.leftOuterJoin, table);
  },

  rightJoin: function(table) {
    return new Join(Join.Type.rightJoin, table);
  },

  rightOuterJoin: function(table) {
    return new Join(Join.Type.rightOuterJoin, table);
  },

  outerJoin: function(table) {
    return new Join(Join.Type.outerJoin, table);
  },

  fullOuterJoin: function(table) {
    return new Join(Join.Type.fullOuterJoin, table);
  },

  case: function() {
    return new Case();
  }

};

