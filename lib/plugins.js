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
        return plugin.stringify;
    }
  },

  jsonStringify(obj) {
    const stringify = this.stringify;
    return stringify ? stringify(obj) : JSON.stringify(obj);
  }

};
