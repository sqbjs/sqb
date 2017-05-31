/* SQB
 ------------------------
 (c) 2017-present Panates
 SQB may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/sqb/
 */

/* Internal module dependencies. */
const Statement = require('./statement');
const Table = require('./tablename');
const ConditionGroup = require('./conditiongroup');

/**
 * @class
 * @public
 */
class Delete extends Statement {

  constructor(dbpool, table) {
    super(dbpool);
    this.type = 'delete';
    this.clearFrom();
    this.clearWhere();
    this.from(table);
  }

  /**
   *
   * @return {Delete}
   * @public
   */
  clearFrom() {
    this._tables = [];
    return this;
  }

  /**
   *
   * @return {Delete}
   * @public
   */
  clearWhere() {
    this._where = new ConditionGroup();
    return this;
  }

  /**
   *
   * @param {string|Raw} table..
   * @return {Delete}
   */
  from(table) {
    if (table)
      this._table = table.isRaw ? table : new Table(String(table));
    return this;
  }

  /**
   *
   * @param {...Condition} condition
   * @return {Delete}
   * @public
   */
  where(...condition) {
    this._where.add(...condition);
    return this;
  }

}

module.exports = Delete;
