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

  use: function(plugin) {
    if (typeof plugin === 'object')
      items.push(plugin);
  },

  get items() {
    return items;
  },

  createPool: function(config) {
    var plugin;
    var result;
    for (var i = 0; i < items.length; i++) {
      plugin = items[i];
      if (typeof plugin.createPool === 'function') {
        result = plugin.createPool(config);
        if (result) return result;
      }
    }
  },

  createSerializer: function(config) {
    var plugin;
    var result;
    for (var i = 0; i < items.length; i++) {
      plugin = items[i];
      if (typeof plugin.createSerializer === 'function') {
        result = plugin.createSerializer(config);
        if (result) return result;
      }
    }
  },

  get stringify() {
    var plugin;
    for (var i = 0; i < items.length; i++) {
      plugin = items[i];
      if (typeof plugin.stringify === 'function')
        return plugin.stringify;
    }
  },

  jsonStringify: function(obj) {
    const stringify = this.stringify;
    return stringify ? stringify(obj) : JSON.stringify(obj);
  }

};
