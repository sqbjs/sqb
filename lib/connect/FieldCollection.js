/* SQB
 ------------------------
 (c) 2017-present Panates
 SQB may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/sqb/
 */

/**
 * @class
 */
class FieldCollection {
  /**
   *
   * @param {Object} meta
   * @param {Object} options
   * @constructor
   */
  constructor(meta, options) {
    this._items = [];
    this._map = new Map();
    /* Clone meta array*/
    meta.forEach((o, i) => {
      o = Object.assign({}, o);
      o.name = options.naming === 'lowercase' ? o.name.toLowerCase() :
          (options.naming === 'uppercase' ? o.name.toUpperCase() : o.name);
      o.index = i;
      this._map.set(o.name.toLowerCase(), o);
      this._items.push(o);
    });
  }

  // noinspection JSUnusedGlobalSymbols
  /**
   * Returns array of fields
   *
   * @return {Array}
   */
  get items() {
    return this._items;
  }

  /**
   * Returns items count
   *
   * @return {number}
   */
  get length() {
    return this._items.length;
  }

  /**
   * Returns index of field
   *
   * @param {String} fieldName
   * @return {number}
   */
  indexOf(fieldName) {
    const f = this.get(fieldName);
    return f ? f.index : -1;
  }

  /**
   * Returns field by index or name
   *
   * @param {Int|String} nameOrIndex
   * @return {Object}
   */
  get(nameOrIndex) {
    if (typeof nameOrIndex === 'number') {
      return nameOrIndex >= 0 && nameOrIndex < this._items.length ?
          this._items[nameOrIndex] : undefined;
    }
    return this._map.get(String(nameOrIndex).toLowerCase());
  }

  /**
   * Returns array of field object with desired options
   * @param {Object} [options]
   * @param {String} [options.naming]
   * @return {Array}
   */
  toArray(options) {
    // close array
    const a = JSON.parse(JSON.stringify(this._items));
    const naming = (options && options.naming);
    if (naming)
      for (const f of a) {
        f.name = naming === 'lowercase' ? f.name.toLowerCase() :
            (naming === 'uppercase' ? f.name.toUpperCase() : f.name);
      }
    return a;
  }

  /**
   * Returns object of field object with desired options
   * @param {Object} [options]
   * @param {String} [options.naming]
   * @return {Object}
   */
  toObject(options) {
    const out = {};
    const naming = (options && options.naming);
    this._items.forEach(function(f) {
      const name = naming === 'lowercase' ? f.name.toLowerCase() :
          (naming === 'uppercase' ? f.name.toUpperCase() : f.name);
      const o = out[name] = Object.assign({}, f);
      delete o.name;
    });
    return out;
  }

  // noinspection JSUnusedGlobalSymbols
  toJSON() {
    return this.toObject();
  }

  toString() {
    return '[object FieldCollection]';
  }

  inspect() {
    return this.toString();
  }

}

/**
 * Expose `FieldCollection`.
 */
module.exports = FieldCollection;


