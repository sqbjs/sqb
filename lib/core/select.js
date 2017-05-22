/* SQB.js
 ------------------------
 (c) 2017-present Panates
 SQB may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/sqb/
 */

/* Internal module dependencies. */

const SqlObject = require('./abstract');
const Table = require('./tablename');
const Column = require('./column');
const Join = require('./join');
const ConditionGroup = require('./conditiongroup');
const Order = require('./order');


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

    /**
     *
     * @return {Select}
     * @public
     */
    clearColumns() {
        this._columns = [];
        return this;
    }

    /**
     *
     * @return {Select}
     * @public
     */
    clearFrom() {
        this._tables = [];
        return this;
    }

    /**
     *
     * @return {Select}
     * @public
     */
    clearJoin() {
        this._joins = [];
        return this;
    }

    /**
     *
     * @return {Select}
     * @public
     */
    clearOrderBy() {
        this._orderby = [];
        return this;
    }

    /**
     *
     * @return {Select}
     * @public
     */
    clearWhere() {
        this._where = new ConditionGroup();
        return this;
    }

    /**
     *
     * @param {string|Raw} columns..
     * @return {Select}
     */
    columns(columns) {
        if (!columns) return this;
        for (let i = 0; i < arguments.length; i++)
            this._columns.push(arguments[i] instanceof SqlObject ? arguments[i] : new Column(arguments[i]));
        return this;
    }

    /**
     *
     * @param {string|Raw} table..
     * @return {Select}
     */
    from(table) {
        if (!table) return this;
        for (let i = 0; i < arguments.length; i++)
            this._tables.push(
                arguments[i].isSelect ||
                arguments[i].isRaw
                    ? arguments[i] :
                    new Table(String(arguments[i])));
        return this;
    }

    /**
     *
     * @param {Array<Join>} joins
     * @return {Select}
     */
    join(joins) {
        if (!joins) return this;
        for (let i = 0; i < arguments.length; i++) {
            if (!(arguments[i] instanceof Join))
                throw new TypeError('Invalid argument in method "join"');
            this._joins.push(arguments[i]);
        }
        return this;
    }

    /**
     *
     * @param {Condition} conditions..
     * @return {Select}
     * @public
     */
    where(conditions) {
        if (!conditions) return this;
        this._where.add.apply(this._where, arguments);
        return this;
    }

    /**
     *
     * @param fields
     * @return {Select}
     * @public
     */
    orderBy(fields) {
        if (!fields) return this;
        for (let i = 0; i < arguments.length; i++)
            this._orderby.push(arguments[i].isOrder ? arguments[i] : new Order(String(arguments[i])));
        return this;
    }

    /**
     *
     * @param {string} alias
     * @return {Select}
     * @public
     */
    alias(alias) {
        this._alias = alias;
        return this;
    }

    /**
     *
     * @param {int} limit
     * @return {Select}
     * @public
     */
    limit(limit) {
        this._limit = limit;
        return this;
    }

    /**
     *
     * @param {int} offset
     * @return {Select}
     * @public
     */
    offset(offset) {
        this._offset = offset;
        return this;
    }

}

module.exports = Select;