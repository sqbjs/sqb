/* SQB
 ------------------------
 (c) 2017-present Panates
 SQB may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/sqb/
 */

/* Internal module dependencies. */
const SqlObject = require('./sqlobjects/abstract');
const Select = require('./sqlobjects/select');
const Insert = require('./sqlobjects/insert');
const Update = require('./sqlobjects/update');
const Delete = require('./sqlobjects/delete');
const Raw = require('./sqlobjects/raw');
const Column = require('./sqlobjects/column');
const Join = require('./sqlobjects/join');
const Condition = require('./sqlobjects/condition');
const ConditionGroup = require('./sqlobjects/conditiongroup');
const Serializer = require('./serializer');
const DbPool = require('./pool');
const Connection = require('./connection');

const sqlObjects = require('./sqlobjects');

/* Register built-in serializers */
require('./dialects/oracle_serializer');

Object.assign(sqlObjects, {

    Serializer,
    DbPool,
    Connection,
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

    serializer: function (config) {
        return Serializer.create(config);
    },

    pool: function (config) {
        return DbPool.create(config);
    }
});

module.exports = sqlObjects;
