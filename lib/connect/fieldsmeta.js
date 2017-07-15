/* SQB
 ------------------------
 (c) 2017-present Panates
 SQB may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/sqb/
 */

/* Internal module dependencies. */

/* External module dependencies. */
const assert = require('assert');

/**
 * @class
 * @public
 */

class FieldsMeta {

  constructor(options) {
    this.fields = [];
    this.fieldNaming = options && options.fieldNaming;
  }

  add(obj) {
    if (Array.isArray(obj)) {
      for (const o of obj)
        this.add(o);
      return;
    }
    assert.ok(obj && typeof obj === 'object', 'Invalid argument');
    assert.ok(obj.name, 'Name required');
    assert.ok(!this.has(obj.name), obj.name + ' already defined');
    if (obj.name && this.fieldNaming) {
      obj.name = this.fieldNaming === 'lowercase' ? obj.name.toLowerCase() :
          (this.fieldNaming === 'uppercase' ? obj.name.toUpperCase() :
              obj.name);
    }
    this.fields.push(obj);
  }

  has(fieldName) {
    return this.indexOf(fieldName) >= 0;
  }

  indexOf(fieldName) {
    fieldName = String(fieldName).toUpperCase();
    for (let i = 0; i < this.fields.length; i++) {
      const o = this.fields[i];
      if (o.name.toUpperCase() === fieldName)
        return i;
    }
    return -1;
  }

  get(field) {
    const i = (typeof field === 'number' ? field : this.indexOf(field));
    return i >= 0 ? this.fields[i] : undefined;
  }

  asArray() {
    return JSON.parse(JSON.stringify(this.fields));
  }

  asObject(options) {
    const out = {};
    for (let i = 0; i < this.fields.length; i++) {
      const f = this.fields[i];
      let name = f.name;
      if (options && options.fieldNaming &&
          options.fieldNaming !== this.fieldNaming)
        name = options.fieldNaming === 'lowercase' ? name.toLowerCase() :
            (options.fieldNaming === 'uppercase' ? name.toUpperCase() : name);
      const o = out[name] = Object.assign({}, f);
      delete o.name;
      o.index = i;
    }
    return out;
  }

  getValue(fieldName, row) {
    if (Array.isArray(row)) {
      const i = this.indexOf(fieldName);
      return i >= 0 ? row[i] : undefined;
    }
    if (typeof row === 'object')
      return row[fieldName];
  }

  setValue(fieldName, value, row) {
    if (Array.isArray(row)) {
      const i = this.indexOf(fieldName);
      if (i >= 0)
        row[i] = value;
    }
    if (typeof row === 'object' && row[fieldName] !== undefined)
      row[fieldName] = value;
  }

  toJSON() {
    return this._objectRows ? this.asObject() : this.fields;
  }

}

module.exports = FieldsMeta;
