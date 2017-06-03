/* SQB
 ------------------------
 (c) 2017-present Panates
 SQB may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/sqb/
 */

/* Internal module dependencies. */

const Statement = require('../interface/statement');
const SqlObject = require('../interface/sqlobject');
const TableName = require('../sqlobjects/tablename');
const Column = require('../sqlobjects/column');
const Join = require('../sqlobjects/join');
const ConditionGroup = require('../sqlobjects/conditiongroup');
const Order = require('../sqlobjects/order');

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
   * @param {...string|Raw} column
   * @return {Select}
   */
  columns(...column) {
    const self = this;
    for (const arg of column) {
      if (Array.isArray(arg)) {
        for (const item of arg) {
          self.columns(item);
        }
      } else if (arg)
        this._columns.push(arg instanceof SqlObject ? arg : new Column(arg));
    }
    return this;
  }

  /**
   *
   * @param {...string|Raw} table
   * @return {Select}
   */
  from(...table) {
    for (const arg of table) {
      if (arg)
        this._tables.push(
            arg.isSelect || arg.isRaw ? arg : new TableName(String(arg)));
    }
    return this;
  }

  /**
   *
   * @param {...Join} join
   * @return {Select}
   */
  join(...join) {
    for (const arg of join) {
      if (arg instanceof Join)
        this._joins.push(arg);
      else if (arg)
        throw new TypeError(
            'Invalid argument in method "join"');
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
   * @param {...Raw|String} field
   * @return {Select}
   * @public
   */
  groupBy(...field) {
    for (const arg of field) {
      if (arg)
        this._groupby.push(arg.isRaw ? arg : new Column(String(arg)));
    }
    return this;
  }

  /**
   *
   * @param {...Raw|String} field
   * @return {Select}
   * @public
   */
  orderBy(...field) {
    for (const arg of field) {
      if (arg)
        this._orderby.push(arg.isRaw ? arg : new Order(String(arg)));
    }
    return this;
  }

  /**
   *
   * @param {string} alias
   * @return {Select}
   * @public
   */
  as(alias) {
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
