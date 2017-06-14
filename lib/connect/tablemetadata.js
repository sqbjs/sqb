/* SQB
 ------------------------
 (c) 2017-present Panates
 SQB may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/sqb/
 */

/* Internal module dependencies. */

/* External module dependencies. */
const assert = require('assert');

/**
 * @class
 * @public
 */

class TableMetaData {

  constructor() {
    this.fields = [];
  }

  add(obj) {
    assert.ok(obj && typeof obj === 'object', 'Invalid argument');
    assert.ok(obj.name, 'Name required');
    assert.ok(!this.has(obj.name), obj.name + ' already defined');
    this.fields.push(obj);
  }

  has(fieldName) {
    return this.indexOf(fieldName) >= 0;
  }

  indexOf(fieldName) {
    fieldName = String(fieldName).toUpperCase();
    for (let i = 0; i < this.fields.length; i++) {
      const o = this.fields[i];
      if (o.name.toUpperCase() === fieldName)
        return i;
    }
    return -1;
  }

  get(fieldName) {
    const i = this.indexOf(fieldName);
    return i >= 0 ? this.fields[i] : undefined;
  }

  getValue(fieldName, row) {
    if (Array.isArray(row)) {
      const i = this.indexOf(fieldName);
      return i >= 0 ? row[i] : undefined;
    }
    if (typeof row === 'object')
      return row[fieldName];
  }

  setValue(fieldName, value, row) {
    if (Array.isArray(row)) {
      const i = this.indexOf(fieldName);
      if (i >= 0)
        row[i] = value;
    }
    if (typeof row === 'object' && row[fieldName] !== undefined)
      row[fieldName] = value;
  }

}

module.exports = TableMetaData;
