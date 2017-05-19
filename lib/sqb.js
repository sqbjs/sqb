/**
 * Internal module dependencies.
 */

const SqlObject = require('./core/abstract');
const Select = require('./core/select');
const Raw = require('./core/raw');
const Column = require('./core/column');
const Join = require('./core/join');
const Condition = require('./core/condition');
const ConditionGroup = require('./core/conditiongroup');
const createGenerator = require('./generator-factory');
const Generator = require('./generator');

/**
 * External module dependencies.
 */


/**
 * @class
 * @public
 */

const Sqb = {

    SqlObject,
    Select,
    Raw,
    Column,
    Join,
    Condition,
    ConditionGroup,
    Generator,

    generator: createGenerator,

    raw: function (str) {
        return new Raw(str);
    },

    select: function (fields) {
        let obj = new Select();
        if (arguments.length > 0)
            obj.columns.apply(obj, arguments);
        return obj;
    },

    column: function (field, alias) {
        return new Column(field, alias);
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
    },

    condition: function (logicalOperator, field, operator, value) {
        if (!field)
            throw new Error('Invalid arguments');
        let item = Array.isArray(field) ? new ConditionGroup(field) :
            Reflect.construct(Condition, Array.prototype.slice.call(arguments, 1));
        item.logicalOperator = logicalOperator;
        return item;
    },

    or: function (field, operator, value) {
        let args = Array.prototype.slice.call(arguments);
        Array.prototype.splice.call(args, 0, 0, 'or');
        return Sqb.condition.apply(Sqb, args);
    },

    and: function (field, operator, value) {
        let args = Array.prototype.slice.call(arguments);
        Array.prototype.splice.call(args, 0, 0, 'and');
        return Sqb.condition.apply(Sqb, args);
    }

};

module.exports = Sqb;