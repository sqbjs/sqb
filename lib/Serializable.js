/* SQB
 ------------------------
 (c) 2017-present Panates
 SQB may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/sqb/
 */

/**
 * Module dependencies.
 * @private
 */
const ParamType = require('./enums').ParamType;

const ReservedWords = [
  'schema', 'table', 'field', 'index', 'foreign', 'key',
  'select', 'insert', 'update', 'delete', 'with', 'merge',
  'join', 'inner', 'outer', 'left', 'right', 'full',
  'from', 'where', 'order', 'by', 'group', 'having',
  'acs', 'ascending', 'dsc', 'descending', 'distinct',
  'and', 'or', 'not', 'between', 'null', 'like', 'ilike',
  'count', 'sum', 'average', 'avg'];

/**
 *
 * @class
 * @abstract
 */
class Serializable {

  /**
   * @constructor
   * @public
   */
  constructor() {
    this.type = null;
    this.isSerializable = true;
  }

  /* istanbul ignore next*/
  /**
   * Performs serialization
   *
   * @param {Object} ctx
   * @return {string}
   * @abstract
   */
  _serialize(ctx) {
    return '';
  }

  /**
   * Performs a fallback mechanism, tries hook functions, extension than default function to serialize
   *
   * @param {Object} ctx
   * @param {String} type
   * @param {*} o
   * @param {Function} defFn
   * @return {String}
   * @public
   */
  static serializeFallback(ctx, type, o, defFn) {
    if (ctx.serializeHooks) {
      for (const hook of ctx.serializeHooks) {
        const x = hook(ctx, type, o, defFn);
        if (x)
          return x;
      }
    }
    return (ctx.extension && ctx.extension.serialize &&
        ctx.extension.serialize(ctx, type, o, defFn)) || defFn();
  }

  /**
   *
   * @param {Object} ctx
   * @param {*} v
   * @return {*}
   */
  static serializeObject(ctx, v) {
    if (v == null)
      return 'null';
    if (v instanceof RegExp)
      return Serializable.serializeParam(ctx, v.source);
    if (Array.isArray(v)) {
      let s = '';
      for (const [i, t] of v.entries()) {
        s += (i ? ',' : '') + Serializable.serializeObject(ctx, t);
      }
      return '(' + s + ')';
    }
    if (v.isSerializable) {
      const s = v._serialize(ctx);
      return s ? (v.isQuery ? '(' + s + ')' : s) :
          /* istanbul ignore next */
          'null';
    }
    if (v instanceof Date) {
      return Serializable.serializeFallback(ctx, 'date', v, () => {
        return Serializable.serializeDateValue(v);
      });
    }
    if (typeof v === 'string') {
      return Serializable.serializeFallback(ctx, 'string', v, () => {
        return Serializable.serializeStringValue(v);
      });
    }
    return v;
  }

  /**
   * Joins array with line feeding
   *
   * @param {Array<String>} arr
   * @param {String} [sep]
   * @param {Integer} [lfLen]
   * @return {String}
   */
  static joinArray(arr, sep, lfLen) {
    let out = '';
    let line = '';
    let k = 0;
    lfLen = lfLen || 60;
    sep = sep || ',';
    for (const s of arr) {
      /* istanbul ignore next */
      if (s === undefined) continue;
      line += (k > 0 ? sep : '');
      if (line.length > lfLen) {
        out += (out ? '\n' : '') + line;
        line = '';
      } else line += line ? ' ' : '';
      line += s;
      k++;
    }
    if (line)
      out += (out ? '\n' : '') + line;
    return out;
  }

  /**
   * Check if a string value is a reserved word
   *
   * @param {Object} ctx
   * @param {String} s
   * @return {boolean|*|Serializable.isReserved}
   */
  static isReserved(ctx, s) {
    return (ReservedWords.indexOf(String(s).toLowerCase()) >= 0) ||
        (ctx.extension && ctx.extension.isReserved &&
            ctx.extension.isReserved(ctx, s));
  }

  /**
   *
   * @param {String} val
   * @return {string}
   */
  static serializeStringValue(val) {
    return '\'' + String(val).replace(/'/g, '\'\'') + '\'';
  }

  /**
   *
   * @param {Date} date
   * @return {string}
   */
  static serializeDateValue(date) {
    const d = date.getDate();
    const m = date.getMonth() + 1;
    const y = date.getFullYear();
    const h = date.getHours();
    const n = date.getMinutes();
    const s = date.getSeconds();
    let str = y + '-' + (m <= 9 ? '0' + m : m) + '-' + (d <= 9 ? '0' + d : d);
    /* istanbul ignore else */
    if (h + n + s)
      str += ' ' + (h <= 9 ? '0' + h : h) + ':' +
          (n <= 9 ? '0' + n : n) + ':' +
          (s <= 9 ? '0' + s : s);
    return '\'' + str + '\'';
  }

  /**
   *
   * @param {Object} ctx
   * @param {String} name
   * @return {string}
   */
  static serializeParam(ctx, name) {
    const prmValue = ctx.values[name];
    ctx.prmValue = prmValue == null ? null : prmValue;
    switch (ctx.paramType) {
      case ParamType.COLON:
      case ParamType.AT:
      case undefined: {
        const symb = ctx.paramType === ParamType.COLON ? ':' : '@';
        ctx.outValues[name] = ctx.prmValue;
        return symb + name;
      }
      case ParamType.DOLLAR: {
        ctx.outValues.push(ctx.prmValue);
        return '$' + (ctx.outValues.length);
      }
      case ParamType.QUESTION_MARK: {
        ctx.outValues.push(ctx.prmValue);
        return '?';
      }
    }
  }

}

/**
 * Expose `Serializable`.
 */
module.exports = Serializable;

