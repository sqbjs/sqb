/* SQB
 ------------------------
 (c) 2017-present Panates
 SQB may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/sqb/
 */

/**
 * Module dependencies.
 * @private
 */
const ArgumentError = require('errorex').ArgumentError;

/**
 * @class
 */
class Row {
  /**
   *
   * @param {Array|Object} data
   * @param {Object} fields
   * @constructor
   */
  constructor(data, fields) {
    this.data = data;
    this.fields = fields;
  }

  get(name) {
    const f = this.fields.get(name);
    if (!f)
      throw new ArgumentError('Field `%s` not found', name);
    if (Array.isArray(this.data)) {
      return f.index < this.data.length ? this.data[f.index] : null;
    } else
      return this.data[f.name] || null;
  }

  set(name, value) {
    const f = this.fields.get(name);
    if (!f)
      throw new ArgumentError('Field `%s` not found', name);
    if (Array.isArray(this.data)) {
      while (this.data.length < f.index + 1)
        this.data.push(null);
      this.data[f.index] = value;
    } else {
      this.data[f.name] = value;
    }
    return this;
  }

  toJSON() {
    return this.data;
  }

  toString() {
    return '[object Row]';
  }

  inspect() {
    return this.toString();
  }

}

/**
 * Expose `Row`.
 */

module.exports = Row;


