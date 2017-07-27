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

  jsonStringify() {
    for (const plugin of items) {
      if (typeof plugin.jsonStringify === 'function')
        return plugin.jsonStringify;
    }
    return JSON.stringify;
  }

};

