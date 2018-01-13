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
    /* istanbul ignore else */
    if (typeof extension === 'object' && items.indexOf(extension) < 0)
      items.push(extension);
  },

  get items() {
    return items;
  },

  createAdapter: function(config) {
    var extension;
    var result;
    for (var i = 0; i < items.length; i++) {
      extension = items[i];
      if (typeof extension.createAdapter === 'function') {
        result = extension.createAdapter(config);
        /* istanbul ignore else */
        if (result) return result;
      }
    }
  },

  createSerializer: function(ctx) {
    var extension;
    var result;
    for (var i = 0; i < items.length; i++) {
      extension = items[i];
      if (typeof extension.createSerializer === 'function') {
        result = extension.createSerializer(ctx);
        /* istanbul ignore else */
        if (result) return result;
      }
    }
  },

  createMetaOperator: function(config) {
    var extension;
    var result;
    for (var i = 0; i < items.length; i++) {
      extension = items[i];
      if (typeof extension.createMetaOperator === 'function') {
        result = extension.createMetaOperator(config);
        /* istanbul ignore else */
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
