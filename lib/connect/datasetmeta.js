/* SQB
 ------------------------
 (c) 2017-present Panates
 SQB may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/sqb/
 */

/* Internal module dependencies. */

/* External module dependencies. */

/**
 * @class
 * @public
 */

class DatasetMeta {

  constructor(meta, options) {
    const self = this;
    // Apply naming rule to metaData
    if (options && options.naming) {
      meta.forEach(f => {
        f.name = options.naming === 'lowercase' ?
            f.name.toLowerCase() :
            (options.naming === 'uppercase' ? f.toUpperCase() : f.name);
      });
    }
    self._items = meta;
    self._map = {};
    if (meta && meta.length > 0) {
      let i = 0;
      for (const f of meta) {
        f.index = i++;
        self._map[f.name.toLowerCase()] = f;
      }
    }
  }

  get fields() {
    return this._items;
  }

  get length() {
    return this._items.length;
  }

  indexOf(fieldName) {
    const f = this.get(fieldName);
    return f ? f.index : -1;
  }

  get(nameOrIndex) {
    if (typeof nameOrIndex === 'number') {
      return nameOrIndex >= 0 && nameOrIndex < this._items.length ?
          this._items[nameOrIndex] : undefined;
    }
    return this._map[String(nameOrIndex).toLowerCase()];
  }

  asArray(options) {
    const a = JSON.parse(JSON.stringify(this._items));
    const naming = (options && options.naming);
    if (naming)
      for (const f of a) {
        f.name = naming === 'lowercase' ? f.name.toLowerCase() :
            (naming === 'uppercase' ? f.name.toUpperCase() : f.name);
      }
    return a;
  }

  asObject(options) {
    const out = {};
    const naming = (options && options.naming);
    for (const f of this._items) {
      const name = naming === 'lowercase' ? f.name.toLowerCase() :
          (naming === 'uppercase' ? f.name.toUpperCase() : f.name);
      const o = out[name] = Object.assign({}, f);
      delete o.name;
    }
    return out;
  }

  toJSON() {
    return this.asObject();
  }

}

module.exports = DatasetMeta;
