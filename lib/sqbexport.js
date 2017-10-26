/* SQB
 ------------------------
 (c) 2017-present Panates
 SQB may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/sqb/
 */

/* Internal module dependencies. */
const Raw = require('./sqlobjects/raw');
const Join = require('./sqlobjects/join');
const Case = require('./sqlobjects/case');

module.exports = {

  //noinspection JSMethodCanBeStatic
  raw: function(str) {
    return new Raw(str);
  },

  //noinspection JSMethodCanBeStatic
  join: function(table) {
    return new Join(Join.Type.innerJoin, table);
  },

  //noinspection JSMethodCanBeStatic
  innerJoin: function(table) {
    return new Join(Join.Type.innerJoin, table);
  },

  //noinspection JSMethodCanBeStatic,JSUnusedGlobalSymbols
  leftJoin: function(table) {
    return new Join(Join.Type.leftJoin, table);
  },

  //noinspection JSMethodCanBeStatic,JSUnusedGlobalSymbols
  leftOuterJoin: function(table) {
    return new Join(Join.Type.leftOuterJoin, table);
  },

  //noinspection JSMethodCanBeStatic,JSUnusedGlobalSymbols
  rightJoin: function(table) {
    return new Join(Join.Type.rightJoin, table);
  },

  //noinspection JSMethodCanBeStatic,JSUnusedGlobalSymbols
  rightOuterJoin: function(table) {
    return new Join(Join.Type.rightOuterJoin, table);
  },

  //noinspection JSMethodCanBeStatic,JSUnusedGlobalSymbols
  outerJoin: function(table) {
    return new Join(Join.Type.outerJoin, table);
  },

  //noinspection JSMethodCanBeStatic,JSUnusedGlobalSymbols
  fullOuterJoin: function(table) {
    return new Join(Join.Type.fullOuterJoin, table);
  },

  //noinspection JSMethodCanBeStatic,JSUnusedGlobalSymbols
  case: function() {
    return new Case();
  }

};

