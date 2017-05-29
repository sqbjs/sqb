/* SQB
 ------------------------
 (c) 2017-present Panates
 SQB may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/sqb/
 */

/* Internal module dependencies. */

const Statement = require('./statement');
const SqlObject = require('./abstract');
const TableName = require('./tablename');
const Column = require('./column');
const Join = require('./join');
const ConditionGroup = require('./conditiongroup');
const Order = require('./order');


/**
 * @class
 * @public
 */

class Select extends Statement {

    constructor(dbpool, ...columns) {
        super(dbpool);
        this.type = 'select';
        this.clearColumns();
        this.clearFrom();
        this.clearJoin();
        this.clearOrderBy();
        this.clearWhere();
        this.clearGroupBy();
        if (columns.length)
            this.columns(...columns);
    }

    get isSelect() {
        return this.type === 'select';
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
    clearGroupBy() {
        this._groupby = [];
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
        const self = this;
        for (const arg of arguments) {
            if (Array.isArray(arg)) {
                arg.forEach(function (item) {
                    self.columns(item);
                })
            } else
                this._columns.push(arg instanceof SqlObject ? arg : new Column(arg));
        }
        return this;
    }

    /**
     *
     * @param {string|Raw} table..
     * @return {Select}
     */
    from(table) {
        if (!table) return this;
        for (const arg of arguments)
            this._tables.push(arg.isSelect || arg.isRaw ? arg : new TableName(String(arg)));
        return this;
    }

    /**
     *
     * @param {Array<Join>} joins
     * @return {Select}
     */
    join(joins) {
        if (!joins) return this;
        for (const arg of arguments) {
            if (arg instanceof Join)
                this._joins.push(arg);
            else
                throw new TypeError('Invalid argument in method "join"');

        }
        return this;
    }

    /**
     *
     * @param {*} conditions...
     * @return {Select}
     * @public
     */
    where(...conditions) {
        this._where.add(...conditions);
        return this;
    }

    /**
     *
     * @param fields
     * @return {Select}
     * @public
     */
    groupBy(fields) {
        if (!fields) return this;
        for (const arg of arguments)
            this._groupby.push(arg.isRaw ? arg : new Column(String(arg)));
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
        for (const arg of arguments)
            this._orderby.push(arg.isRaw ? arg : new Order(String(arg)));
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