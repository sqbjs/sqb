/* SQB.js
   ------------------------
   (c) 2017-present Panates
   SQB may be freely distributed under the MIT license.
   For details and documentation:
   https://panates.github.io/sqb/
*/

/* Internal module dependencies. */

const SqlObject = require('./core/abstract');
const Select = require('./core/select');
const Insert = require('./core/insert');
const Update = require('./core/update');
const Delete = require('./core/delete');

const Raw = require('./core/raw');
const Column = require('./core/column');
const Join = require('./core/join');
const Condition = require('./core/condition');
const ConditionGroup = require('./core/conditiongroup');

const Serializer = require('./serializer');
const createSerializer = require('./serializer-factory');

/* External module dependencies. */


/**
 * @class
 * @public
 */

const Sqb = {

    SqlObject,
    Select,
    Insert,
    Update,
    Delete,
    Raw,
    Column,
    Join,
    Condition,
    ConditionGroup,
    Serializer,

    serializer: createSerializer,

    raw: function (str) {
        return new Raw(str);
    },

    select: function () {
        let obj = new Select();
        if (arguments.length > 0)
            obj.columns.apply(obj, arguments);
        return obj;
    },

    insert: function (columns) {
        let obj = new Insert();
        if (arguments.length > 0)
            obj.columns.apply(obj, arguments);
        return obj;
    },

    update: function (table, values) {
        return new Update(table, values);
    },

    delete: function (table) {
        return new Delete(table);
    },

    join: function (table) {
        return new Join(Join.Type.innerJoin, table);
    },

    innerJoin: function (table) {
        return new Join(Join.Type.innerJoin, table);
    },

    leftJoin: function (table) {
        return new Join(Join.Type.leftJoin, table);
    },

    leftOuterJoin: function (table) {
        return new Join(Join.Type.leftOuterJoin, table);
    },

    rightJoin: function (table) {
        return new Join(Join.Type.rightJoin, table);
    },

    rightOuterJoin: function (table) {
        return new Join(Join.Type.rightOuterJoin, table);
    },

    outerJoin: function (table) {
        return new Join(Join.Type.outerJoin, table);
    },

    fullOuterJoin: function (table) {
        return new Join(Join.Type.fullOuterJoin, table);
    }

};

module.exports = Sqb;