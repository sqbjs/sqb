/* SQB
 ------------------------
 (c) 2017-present Panates
 SQB may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/sqb/
 */

/**
 * Expose `DatasetMeta`.
 */
module.exports = DatasetMeta;

/**
 *
 * @param {Object} meta
 * @param {Object} options
 * @constructor
 */
function DatasetMeta(meta, options) {
  const self = this;
  // Apply naming rule to metaData
  if (options && options.naming) {
    meta.forEach(function(f) {
      f.name = options.naming === 'lowercase' ?
          f.name.toLowerCase() :
          (options.naming === 'uppercase' ? f.toUpperCase() : f.name);
    });
  }
  self._items = meta;
  self._map = {};
  if (meta && meta.length > 0) {
    meta.forEach(function(f, i) {
      f.index = i;
      self._map[f.name.toLowerCase()] = f;
    });
  }
}

const proto = DatasetMeta.prototype = {
  get fields() {
    return this._items;
  },

  get length() {
    return this._items.length;
  }
};
proto.constructor = DatasetMeta;

proto.indexOf = function(fieldName) {
  const f = this.get(fieldName);
  return f ? f.index : -1;
};

proto.get = function(nameOrIndex) {
  if (typeof nameOrIndex === 'number') {
    return nameOrIndex >= 0 && nameOrIndex < this._items.length ?
        this._items[nameOrIndex] : undefined;
  }
  return this._map[String(nameOrIndex).toLowerCase()];
};

proto.asArray = function(options) {
  const a = JSON.parse(JSON.stringify(this._items));
  const naming = (options && options.naming);
  if (naming)
    a.forEach(function(f) {
      f.name = naming === 'lowercase' ? f.name.toLowerCase() :
          (naming === 'uppercase' ? f.name.toUpperCase() : f.name);
    });
  return a;
};

proto.asObject = function(options) {
  const out = {};
  const naming = (options && options.naming);
  this._items.forEach(function(f) {
    const name = naming === 'lowercase' ? f.name.toLowerCase() :
        (naming === 'uppercase' ? f.name.toUpperCase() : f.name);
    const o = out[name] = Object.assign({}, f);
    delete o.name;
  });
  return out;
};

proto.toJSON = function() {
  return this.asObject();
};
