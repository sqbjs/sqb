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

  use: function(extension) {
    if (typeof extension === 'object' && items.indexOf(extension) < 0)
      items.push(extension);
  },

  get items() {
    return items;
  },

  createDriver: function(config) {
    var extension;
    var result;
    for (var i = 0; i < items.length; i++) {
      extension = items[i];
      if (typeof extension.createDriver === 'function') {
        result = extension.createDriver(config);
        if (result) return result;
      }
    }
  },

  createSerializer: function(config) {
    var extension;
    var result;
    for (var i = 0; i < items.length; i++) {
      extension = items[i];
      if (typeof extension.createSerializer === 'function') {
        result = extension.createSerializer(config);
        if (result) return result;
      }
    }
  },

  get stringify() {
    var extension;
    for (var i = 0; i < items.length; i++) {
      extension = items[i];
      if (typeof extension.stringify === 'function')
        return extension.stringify;
    }
  }

};
