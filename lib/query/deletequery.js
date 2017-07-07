/* SQB
 ------------------------
 (c) 2017-present Panates
 SQB may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/sqb/
 */

/* Internal module dependencies. */
const Query = require('./query');
const Table = require('../sqlobjects/tablename');
const ConditionGroup = require('../sqlobjects/conditiongroup');

/**
 * @class
 * @public
 */
class DeleteQuery extends Query {

  constructor(table) {
    super();
    this.type = 'delete';
    this.clearFrom();
    this.clearWhere();
    this.from(table);
  }

  /**
   *
   * @return {DeleteQuery}
   * @public
   */
  clearFrom() {
    this._tables = [];
    return this;
  }

  /**
   *
   * @return {DeleteQuery}
   * @public
   */
  clearWhere() {
    this._where = new ConditionGroup();
    return this;
  }

  /**
   *
   * @param {...string|Raw} table
   * @return {DeleteQuery}
   */
  from(table) {
    if (table) {
      this._table = table.isRaw ? table : new Table(String(table));
    }
    return this;
  }

  /**
   *
   * @param {...Condition} condition
   * @return {DeleteQuery}
   * @public
   */
  where(...condition) {
    this._where.add(...condition);
    return this;
  }

}

module.exports = DeleteQuery;
