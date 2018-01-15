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
  'schema', 'table', 'field', 'index',
  'select', 'insert', 'update', 'delete', 'with', 'merge',
  'join', 'inner', 'outer', 'left', 'right', 'full',
  'from', 'where', 'order', 'by', 'group', 'having',
  'acs', 'ascending', 'dsc', 'descending', 'distinct',
  'and', 'or', 'not', 'between', 'null', 'like',
  'count', 'sum', 'average'];

/**
 * Expose `Serializable`.
 */
module.exports = Serializable;

/**
 * @constructor
 * @public
 */
function Serializable() {
  this.type = undefined;
}

Serializable.prototype = {
  get isSerializable() {
    return true;
  }
};
Serializable.prototype.constructor = Serializable;

/* istanbul ignore next*/
/**
 *
 * @param {Object} ctx
 * @return {string}
 * @abstract
 */
Serializable.prototype._serialize = function(ctx) {
  return '';
};

Serializable.serializeFallback = function(ctx, type, o, defFn) {
  return ctx && ctx.extension && ctx.extension.serialize &&
      ctx.extension.serialize(ctx, type, o, defFn) || defFn();
};

Serializable.serializeObject = function(ctx, o) {
  if (o == null)
    return 'null';
  if (o instanceof RegExp)
    return serializeParam(ctx, o.source);
  var s;
  if (Array.isArray(o)) {
    s = '';
    o.forEach(function(t, i) {
      s += (i ? ',' : '') + Serializable.serializeObject(ctx, t);
    });
    return '(' + s + ')';
  }
  if (o.isSerializable) {
    s = o._serialize(ctx);
    return s ? (o.isQuery ? '(' + s + ')' : s) :
        /* istanbul ignore next */
        'null';
  }
  if (o instanceof Date) {
    return Serializable.serializeFallback(ctx, 'date', o, function() {
      return serializeDateValue(o);
    });
  }
  if (typeof o === 'string') {
    return Serializable.serializeFallback(ctx, 'string', o, function() {
      return serializeStringValue(o);
    });
  }
  return o;
};

Serializable.joinArray = function(arr, sep, lfLen) {
  var out = '';
  var line = '';
  var k = 0;
  lfLen = lfLen || 60;
  sep = sep || ',';
  arr.forEach(function(s) {
    /* istanbul ignore next */
    if (!s) return;
    line += (k > 0 ? sep : '');
    if (line.length > lfLen) {
      out += (out ? '\n' : '') + line;
      line = '';
    } else line += line ? ' ' : '';
    line += s;
    k++;
  });
  if (line)
    out += (out ? '\n' : '') + line;
  return out;
};

Serializable.isReserved = function(ctx, s) {
  return (ReservedWords.indexOf(String(s).toLowerCase()) >= 0) ||
      (ctx.extension && ctx.extension.isReserved &&
          ctx.extension.isReserved(ctx, s));
};

function serializeStringValue(val) {
  return '\'' + String(val).replace(/'/g, '\'\'') + '\'';
}

function serializeDateValue(date) {
  const d = date.getDate();
  const m = date.getMonth() + 1;
  const y = date.getFullYear();
  const h = date.getHours();
  const n = date.getMinutes();
  const s = date.getSeconds();
  var str = y + '-' + (m <= 9 ? '0' + m : m) + '-' + (d <= 9 ? '0' + d : d);
  /* istanbul ignore else */
  if (h + n + s)
    str += ' ' + (h <= 9 ? '0' + h : h) + ':' +
        (n <= 9 ? '0' + n : n) + ':' +
        (s <= 9 ? '0' + s : s);
  return '\'' + str + '\'';
}

function serializeParam(ctx, name) {
  const prmValue = ctx.values[name];
  switch (ctx.paramType) {
    case ParamType.COLON:
    case ParamType.AT:
    case undefined: {
      const symb = ctx.paramType === ParamType.COLON ? ':' : '@';
      ctx.outValues[name] = prmValue == null ? null : prmValue;
      return symb + name;
    }
    case ParamType.DOLLAR: {
      ctx.outValues.push(prmValue == null ? null : prmValue);
      return '$' + (ctx.outValues.length);
    }
    case ParamType.QUESTION_MARK: {
      ctx.outValues.push(prmValue == null ? null : prmValue);
      return '?';
    }
  }
};
