/* SQB
 ------------------------
 (c) 2017-present Panates
 SQB may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/sqb/
 */

const
    items = [];

module.exports = {

  use(plugin) {
    if (typeof plugin === 'object')
      items.push(plugin);
  },

  get items() {
    return items;
  },

  createPool(config) {
    for (const plugin of items) {
      if (typeof plugin.createPool === 'function') {
        const result = plugin.createPool(config);
        if (result) return result;
      }
    }
  },

  createSerializer(config) {
    for (const plugin of items) {
      if (typeof plugin.createSerializer === 'function') {
        const result = plugin.createSerializer(config);
        if (result) return result;
      }
    }
  },

  get stringify() {
    for (const plugin of items) {
      if (typeof plugin.stringify === 'function')
        return function(v) {
          if (v instanceof Date || v instanceof Number) {
            const n = plugin.stringify(v);
            return typeof n === 'string' ? n : defaultStringify(v);
          }
          return v;
        };
    }
    return noStringify;
  },

  jsonStringify(obj) {
    const stringify = this.stringify;
    if (stringify !== defaultStringify)
      return JSON.stringify(obj, (k, v) => {
        const n = obj[k];
        if (n instanceof Date || n instanceof Number)
          return stringify(obj[k]);
        return v;
      });
    return JSON.stringify(obj);
  }

};

function noStringify(v) {
  return v;
}

function defaultStringify(v) {
  return v && v.toISOString ? v.toISOString() : String(v);
}
