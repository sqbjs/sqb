/* SQB
 ------------------------
 (c) 2017-present Panates
 SQB may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/sqb/
 */

/* Internal module dependencies. */
const Select = require('./sqlobjects/select');
const Insert = require('./sqlobjects/insert');
const Update = require('./sqlobjects/update');
const Delete = require('./sqlobjects/delete');

const Raw = require('./sqlobjects/raw');
const Join = require('./sqlobjects/join');


module.exports = {

    //noinspection JSMethodCanBeStatic
    raw (str) {
        return new Raw(str);
    },

    //noinspection JSMethodCanBeStatic
    select (...columns) {
        return new Select(this, ...columns);
    },

    //noinspection JSMethodCanBeStatic
    insert (...columns) {
        return new Insert(this, ...columns);
    },

    //noinspection JSMethodCanBeStatic
    update (table, values) {
        return new Update(this, table, values);
    },

    //noinspection JSMethodCanBeStatic,ReservedWordAsName
    delete (table) {
        return new Delete(this, table);
    },

    //noinspection JSMethodCanBeStatic
    join (table) {
        return new Join(Join.Type.innerJoin, table);
    },

    //noinspection JSMethodCanBeStatic
    innerJoin (table) {
        return new Join(Join.Type.innerJoin, table);
    },

    //noinspection JSMethodCanBeStatic,JSUnusedGlobalSymbols
    leftJoin (table) {
        return new Join(Join.Type.leftJoin, table);
    },

    //noinspection JSMethodCanBeStatic,JSUnusedGlobalSymbols
    leftOuterJoin (table) {
        return new Join(Join.Type.leftOuterJoin, table);
    },

    //noinspection JSMethodCanBeStatic,JSUnusedGlobalSymbols
    rightJoin (table) {
        return new Join(Join.Type.rightJoin, table);
    },

    //noinspection JSMethodCanBeStatic,JSUnusedGlobalSymbols
    rightOuterJoin (table) {
        return new Join(Join.Type.rightOuterJoin, table);
    },

    //noinspection JSMethodCanBeStatic,JSUnusedGlobalSymbols
    outerJoin (table) {
        return new Join(Join.Type.outerJoin, table);
    },

    //noinspection JSMethodCanBeStatic,JSUnusedGlobalSymbols
    fullOuterJoin (table) {
        return new Join(Join.Type.fullOuterJoin, table);
    },
};