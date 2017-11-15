/* SQB
 ------------------------
 (c) 2017-present Panates
 SQB may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/sqb/
 */

/**
 * Expose `FieldCollection`.
 */
module.exports = FieldCollection;

/**
 *
 * @param {Object} meta
 * @param {Object} options
 * @constructor
 */
function FieldCollection(meta, options) {
  const self = this;
  /* Clone meta array*/
  self._map = {};
  const items = [];
  meta.forEach(function(o, i) {
    o = Object.assign({}, o);
    o.name = options.naming === 'lowercase' ? o.name.toLowerCase() :
        (options.naming === 'uppercase' ? o.name.toUpperCase() : o.name);
    o.index = i;
    self._map[o.name.toLowerCase()] = o;
    items.push(o);
  });
  self._items = items;
}

FieldCollection.prototype = {
  get items() {
    return this._items;
  },

  get length() {
    return this._items.length;
  }
};
FieldCollection.prototype.constructor = FieldCollection;

FieldCollection.prototype.indexOf = function(fieldName) {
  const f = this.get(fieldName);
  return f ? f.index : -1;
};

FieldCollection.prototype.get = function(nameOrIndex) {
  if (typeof nameOrIndex === 'number') {
    return nameOrIndex >= 0 && nameOrIndex < this._items.length ?
        this._items[nameOrIndex] : undefined;
  }
  return this._map[String(nameOrIndex).toLowerCase()];
};

FieldCollection.prototype.toArray = function(options) {
  const a = JSON.parse(JSON.stringify(this._items));
  const naming = (options && options.naming);
  if (naming)
    a.forEach(function(f) {
      f.name = naming === 'lowercase' ? f.name.toLowerCase() :
          (naming === 'uppercase' ? f.name.toUpperCase() : f.name);
    });
  return a;
};

FieldCollection.prototype.toObject = function(options) {
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

FieldCollection.prototype.toJSON = function() {
  return this.toObject();
};
