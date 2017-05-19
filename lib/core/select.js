/**
 * Internal module dependencies.
 */

const SqlObject = require('./abstract');
const Table = require('./table');
const Column = require('./column');
const Join = require('./join');
const ConditionGroup = require('./conditiongroup');
const Order = require('./order');

/**
 * External module dependencies.
 */


/**
 * @class
 * @public
 */

class Select extends SqlObject {

    constructor() {
        super();
        this.type = 'select';
        this.clearColumns();
        this.clearFrom();
        this.clearJoin();
        this.clearOrderBy();
        this.clearWhere();
    }

    get isSelect() {
        return true;
    }

    columns(columns) {
        if (arguments.length === 0 || !columns) return this;
        for (let i = 0; i < arguments.length; i++)
            this.addColumn(arguments[i]);
        return this;
    }

    clearColumns() {
        this._columns = [];
    }

    clearFrom() {
        this._tables = [];
    }

    clearJoin() {
        this._joins = [];
    }

    clearOrderBy() {
        this._orderby = [];
    }

    clearWhere() {
        this._where = new ConditionGroup();
    }

    addColumn(obj) {
        this._columns.push(obj instanceof SqlObject ? obj : Reflect.construct(Column, arguments));
    }

    from(table) {
        if (arguments.length === 0 || !table) return this;
        for (let i = 0; i < arguments.length; i++)
            this._tables.push(arguments[i] instanceof Table ? arguments[i] : new Table(String(arguments[i])));
        return this;
    }

    join(joins) {
        if (arguments.length === 0 || !joins) return this;
        for (let i = 0; i < arguments.length; i++) {
            if (!(arguments[i] instanceof Join))
                throw new TypeError('Invalid argument in method "join"');
            this._joins.push(arguments[i]);
        }
        return this;
    }

    where(conditions) {
        if (arguments.length === 0 || !conditions) return this;
        this._where.add.apply(this._where, arguments);
        return this;
    }

    orderBy(fields) {
        if (arguments.length === 0 || !fields) return this;
        for (let i = 0; i < arguments.length; i++)
            this._orderby.push(arguments[i].isOrder ? arguments[i] : new Order(String(arguments[i])));
        return this;
    }

    alias(alias) {
        this._alias = alias;
        return this;
    }

    limit(limit) {
        this._limit = limit;
        return this;
    }

    offset(offset) {
        this._offset = offset;
        return this;
    }

}

module.exports = Select;