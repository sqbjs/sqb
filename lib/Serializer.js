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
const assert = require('assert');
const flattenText = require('putil-flattentext');
const ParamType = require('./types').ParamType;
const extensions = require('./extensions');

/**
 * Module functions
 * @private
 */

function isNumeric(n) {
  return isFinite(n) && +n === n;
}

/**
 * Expose `Serializer`.
 */
module.exports = Serializer;

/**
 * Creates SQL Serializer object
 *
 * @param {Object} config
 * @param {String} config.dialect
 * @param {Boolean} [config.prettyPrint = true]
 * @param {Number} [config.paramType = ParamType.COLON]
 * @param {Boolean} [config.strictParams]
 * @constructor
 * @public
 */
function Serializer(config) {
  config = typeof config === 'object' ? config : {dialect: config};
  const self = this;
  self._config = config;
  self._prmGen = 1;
  this.serializerExtension = extensions.createSerializer(self._config);
  config.paramType = config.paramType ||
      (this.serializerExtension ? this.serializerExtension.paramType : 0) ||
      ParamType.COLON;
  config.prettyPrint = config.prettyPrint === undefined ? true :
      !!config.prettyPrint;
}

Serializer.prototype = {

  get isSerializer() {
    return true;
  },

  get dialect() {
    return this._config.dialect;
  },

  get prettyPrint() {
    return this._config.prettyPrint;
  },

  set prettyPrint(val) {
    this._config.prettyPrint = val;
  },

  get paramType() {
    return this._config.paramType;
  },

  set paramType(val) {
    this._config.paramType = val;
  },

  get strictParams() {
    return this._config.strictParams;
  },

  set strictParams(value) {
    this._config.strictParams = value;
  }
};
Serializer.prototype.constructor = Serializer;

/**
 * Serializes sql query object to string representation
 *
 * @param {Query} query
 * @param {Array|Object} [inputValues]
 * @return {Object}
 * @public
 */
Serializer.prototype.generate = function(query, inputValues) {
  assert.ok(['select', 'insert', 'update', 'delete'].indexOf(query.type) >= 0,
      'Invalid argument');
  const self = this;
  inputValues = inputValues || query._params;
  assert(!inputValues || Array.isArray(inputValues) ||
      typeof inputValues === 'object', 'Invalid argument');
  const instance = new SerializerInstance(self);
  const result = {
    sql: instance.generate(query, inputValues),
    values: instance.outParams
  };
  if (instance.returningParams)
    result.returningParams = instance.returningParams;
  return result;
};

/**
 *
 * @param {Object} owner
 * @constructor
 */
function SerializerInstance(owner) {
  if (owner instanceof SerializerInstance) {
    this.outParams = owner.outParams;
    this.outParamsCache = owner.outParamsCache;
    this.inputValues = owner.inputValues;
    this.reservedWords = owner.reservedWords;
    this.config = owner.config;
    this._prmGen = owner._prmGen;
  } else {
    this.config = Object.assign({}, owner._config);
    this.outParams = owner.paramType === ParamType.COLON ? {} : [];
    this.outParamsCache = {};
    this._prmGen = {generator: 0};
    this.reservedWords = [
      'schema', 'table', 'field', 'index', 'acs', 'ascending', 'dsc',
      'descending', 'distinct',
      'select', 'insert', 'update', 'delete',
      'merge', 'join', 'inner', 'outer', 'left', 'right', 'full',
      'with', 'from', 'where', 'order', 'by', 'group', 'having',
      'and', 'or', 'not', 'between', 'null', 'like',
      'count', 'sum', 'average'];
  }
  this.serializerExtension = owner.serializerExtension;
}

/**
 *
 * @param {String} str
 * @return {boolean}
 */
SerializerInstance.prototype.isReserved = function(str) {
  str = String(str).toLowerCase();
  if (this.reservedWords.indexOf(str) >= 0)
    return true;
  if (this.serializerExtension &&
      typeof this.serializerExtension.isReserved === 'function')
    return this.serializerExtension.isReserved(str);
};

/**
 *
 * @param {Query} query
 * @param {...*} inputValues
 * @return {string}
 */
SerializerInstance.prototype.generate = function(query, inputValues) {
  this.query = query;
  this.inputValues = inputValues;
  const sql = __serialize(this, this.query);
  return flattenText(sql, {noWrap: !this.config.prettyPrint});
};

/**
 * Serialize Select query
 *
 * @param {SelectQuery} query Select query object
 * @return {String}
 * @protected
 */
SerializerInstance.prototype.serializeSelect = function(query) {
  const self = this;
  var out = 'select';
  var sep;

  // columns part
  var s = serializeColumns(self, query._columns, {section: 'select.columns'}) ||
      '*';
  if (s.length > 60 || s.indexOf('\n') >= 0) {
    out += '\n\t' + s + '\b';
    sep = '\n';
  } else {
    out += ' ' + s;
    sep = ' ';
  }

  // from part
  s = serializeFrom(self, query._tables, {section: 'select.from'});
  if (s) {
    if (s.indexOf('\n') >= 0)
      sep = '\n';
    out += sep + s;
  }

  s = serializeJoins(self, query._joins, {section: 'select.joins'});
  if (s) {
    out += '\n' + s;
    sep = '\n';
  }

  s = serializeWhere(self, query._where, {section: 'select.where'});
  if (s) {
    if (sep === '\n' || s.length > 60) {
      out += '\n' + s;
    } else {
      out += sep + s;
    }
  }

  s = serializeGroupBy(self, query._groupby, {section: 'select.groupby'});
  if (s)
    out += '\ngroup by ' + s;

  s = serializeOrderBy(self, query._orderby, {section: 'select.orderby'});
  if (s)
    out += '\n' + s;
  return out;
};

/**
 * Serialize Insert query
 *
 * @param {InsertQuery} query Insert query object
 * @return {string}
 * @protected
 */
SerializerInstance.prototype.serializeInsert = function(query) {
  assert.ok(query && query._table &&
      ['raw', 'table'].indexOf(query._table.type) >= 0,
      'Invalid argument. Only Raw or TableName allowed in "insert(?)"');
  assert(!!query._values, 'values required for Insert query');

  const self = this;
  var out = 'insert into ' +
      __serialize(self, query._table, {section: 'insert.table'}) +
      ' (' +
      serializeColumns(self, query._columns, {section: 'insert.columns'}) +
      ')';

  // values
  const objValues = query._values;
  var s;
  if (['raw', 'select'].indexOf(objValues.type) >= 0) {
    out += (objValues.type === 'select' ? '\n' : ' ') +
        __serialize(self, objValues, {section: 'insert.values'});
  } else {
    out += ' values (';
    self._prmIdx = 0;

    // Iterate over columns
    const iinf = {
      section: 'insert.values',
      index: 0
    };
    query._columns.forEach(function(col, idx) {
      const field = col.field.toUpperCase();
      const val = objValues[field];
      iinf.index = idx;
      out += (idx ? ', ' : '') +
          serializeValue(self, val, iinf);
    });
    out += ')';
  }
  if (query._returning) {
    s = serializeReturning(self, query._returning,
        {section: 'insert.returning'});
    /* istanbul ignore else */
    if (s)
      out += '\n' + s;
  }
  return out;
};

/**
 * Serialize UpdateQuery query
 *
 * @param {UpdateQuery} query Update query object
 * @return {string}
 * @protected
 */
SerializerInstance.prototype.serializeUpdate = function(query) {
  assert.ok(query && query._table &&
      ['raw', 'table'].indexOf(query._table.type) >= 0,
      'Invalid argument. Only Raw or TableName allowed in "update(?)"');
  assert.ok(!!query._values, 'values required for Update query');

  const self = this;
  var out = 'update ' +
      __serialize(self, query._table, {section: 'update.table'}) +
      ' set\n\t';

  // Serialize update values
  if (query._values.isRaw) {
    out += serializeRaw(self, query._values, {section: 'update.values'});
  } else {
    // Iterate over update values
    const values = query._values;
    const iinf = {
      section: 'update.values',
      index: 0
    };
    Object.getOwnPropertyNames(values).forEach(function(key, idx) {
          iinf.index = idx;
          const s = serializeUpdateValue(self, key, values[key], iinf);
          /* istanbul ignore else */
          if (s)
            out += (idx ? ',\n' : '') + s;
        }
    );
    out += '\b';
  }

  // Serialize conditions
  var s = serializeWhere(self, query._where, {section: 'update.where'});
  if (s)
    out += '\n' + s;

  if (query._returning) {
    s = serializeReturning(self, query._returning,
        {section: 'update.returning'});
    /* istanbul ignore else */
    if (s)
      out += '\n' + s;
  }

  return out;
};

/**
 * Serialize Delete query
 *
 * @param {DeleteQuery} query Delete query object
 * @return {string}
 * @protected
 */
SerializerInstance.prototype.serializeDelete = function(query) {
  assert.ok(query && query._table &&
      ['raw', 'table'].indexOf(query._table.type) >= 0,
      'Invalid argument. Only Raw or TableName allowed in "delete(?)"');
  const self = this;
  var out = 'delete from ' +
      __serialize(self, query._table, {section: 'delete.table'});

  // Serialize conditions
  const s = serializeWhere(self, query._where, {section: 'delete.where'});
  if (s)
    out += (s.length > 60 ? '\n' : ' ') + s;

  return out;
};

/**
 * Serializes array of column names comes after 'Select'
 *
 * @param {Array<Column>} columns
 * @param {Object} inf - Helper information
 * @return {string}
 * @protected
 */
SerializerInstance.prototype.serializeColumns = function(columns, inf) {
  if (!(columns && columns.length)) return '';
  var out = '';
  var line = '';
  var k = 0;
  const self = this;
  const iinf = {section: inf.section, index: 0};
  columns.forEach(function(col) {
    const s = serializeColumn(self, col, iinf);
    if (s) {
      line += (k > 0 ? ',' : '');
      if (line.length > 60) {
        out += (out ? '\n' : '') + line;
        line = '';
      } else line += line ? ' ' : '';
      line += s;
      k++;
    }
    iinf.index++;
  });
  if (line)
    out += (out ? '\n' : '') + line;
  return out;
};

/**
 * Serializes array of column names comes after 'Select'
 *
 * @param {Column} column
 * @param {Object} inf - Helper information
 * @return {string}
 * @protected
 */
SerializerInstance.prototype.serializeColumn = function(column, inf) {
  assert.ok(['column', 'raw', 'case', 'select'].indexOf(column.type) >= 0,
      'Invalid object for serializing column');
  const s = __serialize(this, column, inf);
  return column.type === 'select' ?
      '(' + s + ')' +
      (column._alias ?
          ' ' + (this.isReserved(column._alias) ? '"' + column._alias +
          '"' : column._alias)
          : '') :
      s;
};

/**
 * Serializes single field name
 *
 * @param {Column} field
 * @param {Object} inf - Helper information
 * @return {string}
 * @protected
 */
SerializerInstance.prototype.serializeFieldName = function(field, inf) {
  return (field.table ? field.table + '.' : '') +
      (this.isReserved(field.field) ? '"' + field.field + '"' : field.field) +
      (field.alias ? ' ' +
          (this.isReserved(field.alias) ? '"' + field.alias +
              '"' : field.alias) : '');
};

/**
 * Serializes tables names comes after 'From'
 *
 * @param {Array<SqlObject>} tables
 * @param {Object} inf - Helper information
 * @return {string}
 * @protected
 */
SerializerInstance.prototype.serializeFrom = function(tables, inf) {
  if (!(tables && tables.length)) return '';
  var out = '';
  const iinf = {section: inf.section, index: 0};
  const self = this;
  tables.forEach(function(item) {
    assert.ok(['raw', 'select', 'table'].indexOf(item.type) >= 0,
        'Invalid object used as Table Name');
    var s = __serialize(self, item, iinf);
    if (s) {
      const lf = s.length > 40;
      if (item.type === 'select') {
        s = '(' + (lf ? '\n\t' : '') + s + ')' + (lf ? '\b' : '') +
            (item._alias ? ' ' + item._alias : '');
      }
      out += (out ? ', ' : ' ') + s;
    }
    iinf.index++;
  });
  return out ? 'from' + out : '';
};

/**
 * Serializes array of Joins
 *
 * @param {Array<Join>} joins
 * @param {Object} inf - Helper information
 * @return {string}
 * @protected
 */
SerializerInstance.prototype.serializeJoins = function(joins, inf) {
  if (!joins || !joins.length) return '';
  const self = this;
  var out = '';
  const iinf = {section: 'joins', index: 0};
  joins.forEach(function(j) {
    const s = serializeJoin(self, j, iinf);
    /* istanbul ignore else */
    if (s)
      out += (out ? '\n' : '') + s;
    iinf.index++;
  });
  return out;
};

/**
 * Serializes single Join
 *
 * @param {Join} join
 * @param {Object} inf - Helper information
 * @return {string}
 * @protected
 */
SerializerInstance.prototype.serializeJoin = function(join, inf) {
  var out;
  switch (join.joinType) {
    case 1:
      out = 'left join';
      break;
    case 2:
      out = 'left outer join';
      break;
    case 3:
      out = 'right join';
      break;
    case 4:
      out = 'right outer join';
      break;
    case 5:
      out = 'outer join';
      break;
    case 6:
      out = 'full outer join';
      break;
    default:
      out = 'inner join';
      break;
  }

  assert.ok(['raw', 'select', 'table'].indexOf(join.table.type) >= 0,
      'Invalid object used as Table Name');
  var s = __serialize(this, join.table, inf);
  const lf = s.length > 40;
  /* istanbul ignore else */
  if (s) {
    if (join.table.type === 'select') {
      s = '(' + (lf ? '\n\t' : '') + s + ')' +
          (join.table._alias ? ' ' + join.table._alias : '');
    }
    out += ' ' + s;
  }

  s = serializeConditionGroup(this, join.conditions, {section: 'join.on'});
  if (s)
    out += ' on ' + s;

  return out + (lf ? '\b' : '');
};

/**
 * Serialize Raw object
 *
 * @param {Raw} raw
 * @param {Object} inf - Helper information
 * @return {string}
 * @protected
 */
// eslint-disable-next-line
SerializerInstance.prototype.serializeRaw = function(raw, inf) {
  return (raw && raw.text) || '';
};

/**
 * Serializes single table name
 *
 * @param {TableName} table
 * @param {Object} inf - Helper information
 * @return {string}
 * @protected
 */
SerializerInstance.prototype.serializeTableName = function(table, inf) {
  return (table.schema ? table.schema + '.' : '') +
      table.table +
      (table.alias ? ' ' + table.alias : '');
};

/**
 * Serializes single table name
 *
 * @param {ConditionGroup} group
 * @param {Object} inf - Helper information
 * @return {string}
 * @protected
 */
SerializerInstance.prototype.serializeWhere = function(group, inf) {
  const s = serializeConditionGroup(this, group, inf);
  return s ? 'where ' + s : '';
};

/**
 * Serializes condition group
 *
 * @param {ConditionGroup} group
 * @param {Object} inf - Helper information
 * @return {string}
 * @protected
 */
SerializerInstance.prototype.serializeConditionGroup = function(group, inf) {
  if (!group || !group.length) return '';
  const self = this;
  var out = '';
  var line = '';
  var logop;
  var k = 0;
  var lf = 0;
  const iinf = {section: 'conditiongroup', index: 0};

  group._items.forEach(function(item) {
    assert.ok(['raw', 'conditiongroup', 'condition'].indexOf(item.type) >= 0,
        'Invalid object used as Condition');
    logop = item.logicalOperator;
    var s = __serialize(self, item, iinf);
    /* istanbul ignore else */
    if (s) {
      if (item.type === 'conditiongroup') s = '(' + s + ')';

      line += (k > 0 ? ' ' + logop : '');
      if (line.length > 60) {
        out += (out ? '\n' + (lf === 1 ? '\t' : '') : '') + line;
        lf++;
        line = '';
      } else line += line ? ' ' : '';

      line += s;
      k++;
    }
    iinf.index++;
  });
  /* istanbul ignore else */
  if (line)
    out += (out ? '\n' + (lf === 1 ? '\t' : '') : '') + line;
  return out + (lf >= 1 ? '\b' : '');
};

/**
 * Serializes condition
 *
 * @param {Condition} item
 * @param {Object} inf - Helper information
 * @return {string}
 * @protected
 */
SerializerInstance.prototype.serializeCondition = function(item, inf) {
  const self = this;
  var str;
  if (['raw', 'select'].indexOf(item.field.type) >= 0) {
    str = (str = __serialize(self, item.field, inf)) &&
        (item.field.type === 'select' ? '(' + str + ')' : str);
  } else
    str = self.isReserved(item.field) ? '"' + item.field + '"' : item.field;

  var operator = item.operator.toLowerCase();
  var s;
  var prm;
  var prmValue;
  if (item.param) {
    prm = item.param;
    prmValue = self.inputValues && self.inputValues[prm];
  } else if (self.config.strictParams && !item.value.isSqlObject) {
    prm = self.prmGen();
    prmValue = item.value;
  }

  if (['between', '!between', 'not between'].indexOf(operator) >= 0) {
    if (prm) {
      s = self.serializeParam(prm, prmValue, true);
    } else {
      s = serializeValue(self, item.value[0], inf) + ' and ' +
          serializeValue(self, item.value[1], inf);
    }

  } else if ((['like', '!like', 'not like'].indexOf(operator) >= 0) &&
      !prm && Array.isArray(item.value) &&
      (s = item.value.join())) {
    s = '(';
    item.value.forEach(function(v, i) {
      s += (i > 0 ? ' or ' : '') + str + ' ' +
          serializeConditionalOperator(self, operator, inf) + ' ' +
          serializeValue(self, String(v), inf);
    });
    return s + ')';

  } else if (prm) {
    s = self.serializeParam(prm, prmValue);
  } else {
    s = serializeValue(self, item.value, inf);
    if (s.startsWith('(')) {
      if (['!=', '<>', ' not like', '!like'].indexOf(operator) >= 0)
        operator = 'not in';
      else operator = 'in';
    }
  }

  /* istanbul ignore else */
  if (s)
    str += ' ' + serializeConditionalOperator(self, operator, inf) + ' ' + s;
  return str;
};

SerializerInstance.prototype.serializeParam = function(prm, prmValue, multi) {
  const valIsArray = Array.isArray(prmValue);
  const outParams = this.outParams;
  var s;
  switch (this.config.paramType) {
    case ParamType.COLON:
    case ParamType.AT:
    case undefined: {
      const sign = this.config.paramType === ParamType.COLON ? ':' : '@';
      if (multi) {
        s = sign + prm + '1 and :' + prm + '2';
        outParams[prm + '1'] = (valIsArray ? prmValue[0] : prmValue);
        outParams[prm + '2'] = (valIsArray ? prmValue[1] : prmValue);
      } else {
        s = sign + prm;
        outParams[prm] = prmValue == null ? null : prmValue;
      }
      break;
    }
    case ParamType.DOLLAR: {
      if (multi) {
        s = '$' + (outParams.length + 1) + ' and ' +
            '$' + (outParams.length + 2);
        outParams.push(valIsArray ? prmValue[0] : prmValue);
        outParams.push(valIsArray ? prmValue[1] : prmValue);
      } else {
        s = '$' + (outParams.length + 1);
        outParams.push(prmValue == null ? null : prmValue);
      }
      break;
    }
    case ParamType.QUESTION_MARK: {
      if (multi) {
        s = '? and ?';
        outParams.push(valIsArray ? prmValue[0] : prmValue);
        outParams.push(valIsArray ? prmValue[1] : prmValue);
      } else {
        s = '?';
        outParams.push(prmValue == null ? null : prmValue);
      }
      break;
    }
  }
  return s;
};

/**
 * Serializes any value
 *
 * @param {*} val
 * @param {Object} inf - Helper information
 * @return {string}
 * @protected
 */
SerializerInstance.prototype.serializeValue = function(val, inf) {
  if (val == null)
    return 'null';
  const self = this;

  if (val instanceof RegExp) {
    const prm = val.source;
    const inputValues = self.inputValues;
    var x = self.outParamsCache[prm];

    if (x === undefined) {
      if (Array.isArray(inputValues)) {
        x = self._prmIdx < inputValues.length ?
            inputValues[self._prmIdx++] :
            null;
      } else if (typeof inputValues === 'object')
        x = inputValues[prm] == null ? null : inputValues[prm];
      self.outParamsCache[prm] = x;
    }
    return self.serializeParam(prm, x);
  }
  if (val.isRaw)
    return serializeRaw(self, val, inf);
  var s;
  if (val.type === 'select') {
    s = serializeSelect(self, val);
    return s ? '(' + s + ')' : 'null';
  }
  if (val.type === 'case') {
    s = serializeCase(self, val);
    return s ? '(' + s + ')' : 'null';
  }
  if (isNumeric(val))
    return String(val);
  if (val instanceof Date)
    return serializeDateValue(self, val, inf);
  if (Array.isArray(val))
    return serializeArrayValue(self, val, inf);
  return serializeStringValue(self, String(val), inf);
};

/**
 * Serializes string value
 *
 * @param {string} val
 * @param {Object} inf - Helper information
 * @return {string}
 * @protected
 */
SerializerInstance.prototype.serializeStringValue = function(val, inf) {
  return '\'' + (val || '').replace('\'', '\'\'') + '\'';
};

/**
 * Serializes Date value
 *
 * @param {Date} date
 * @param {Object} inf - Helper information
 * @return {string}
 * @protected
 */
SerializerInstance.prototype.serializeDateValue = function(date, inf) {
  const d = date.getDate();
  const m = date.getMonth() + 1;
  const y = date.getFullYear();
  const h = date.getHours();
  const n = date.getMinutes();
  const s = date.getSeconds();
  var str = y + '-' + (m <= 9 ? '0' + m : m) + '-' + (d <= 9 ? '0' + d : d);
  if (h || n || s)
    str += ' ' + (h <= 9 ? '0' + h : h) + ':' +
        (n <= 9 ? '0' + n : n) + ':' +
        (s <= 9 ? '0' + s : s);
  return '\'' + str + '\'';
};

/**
 * Serializes Array value
 *
 * @param {Array} arr
 * @param {Object} inf - Helper information
 * @return {string}
 * @protected
 */
SerializerInstance.prototype.serializeArrayValue = function(arr, inf) {
  var str = '';
  const self = this;
  arr.forEach(function(s) {
    str += (str ? ',' : '') + serializeValue(self, s, inf);
  });
  return str ? '(' + str + ')' : '';
};

/**
 * Serializes array of 'group by' columns
 *
 * @param {Array<Column>} columns
 * @param {Object} inf - Helper information
 * @return {string}
 * @protected
 */
SerializerInstance.prototype.serializeGroupBy = function(columns, inf) {
  return serializeColumns(this, columns, {section: 'groupby'});
};

/**
 * Serializes array of 'order by' columns
 *
 * @param {Array<OrderBy>} columns
 * @param {Object} inf - Helper information
 * @return {string}
 * @protected
 */
SerializerInstance.prototype.serializeOrderBy = function(columns, inf) {
  if (!(columns && columns.length)) return '';
  const self = this;
  var out = '';
  const iinf = {section: inf.section, index: 0};
  columns.forEach(function(o) {
    var s;
    if (o.isRaw)
      s = serializeRaw(self, o, iinf);
    else s = (o.table ? o.table + '.' : '') + o.field +
        (o.descending ? ' desc' : '');

    if (s)
      out += (out ? ', ' : '') + s;
    iinf.index++;
  });
  return 'order by ' + out;
};

/**
 * Serializes single value for Update query
 *
 * @param {string} key
 * @param {*} value
 * @param {Object} inf - Helper information
 * @return {string}
 * @protected
 */
SerializerInstance.prototype.serializeUpdateValue = function(key, value, inf) {
  const self = this;
  var s;
  if (value instanceof RegExp) {
    const x = self.inputValues && self.inputValues[key];
    s = self.serializeParam(key, x);
  } else
    s = serializeValue(self, value, inf);
  return (key + ' = ' + s);
};

/**
 * Serializes Case expression
 *
 * @param {Case} obj
 * @param {Object} inf - Helper information
 * @return {string}
 * @protected
 */
SerializerInstance.prototype.serializeCase = function(obj, inf) {
  if (obj._expressions.length) {
    const self = this;
    var out = 'case\n\t';
    const iinf = {section: 'case', index: 0};
    obj._expressions.forEach(function(item) {
      assert.ok(['conditiongroup', 'condition', 'raw'].indexOf(
          item.condition.type) >= 0,
          'Invalid object used in "case" expression');
      const s = __serialize(self, item.condition, iinf);
      if (s) {
        const v = serializeValue(self, item.value, iinf);
        out += 'when ' + s + ' then ' +
            (v == null ? 'null' : v) + '\n';
      }
      iinf.index++;
    });

    iinf.index = 'else';
    if (obj._elseValue !== undefined) {
      const v = serializeValue(self, obj._elseValue, iinf);
      if (!(v == null))
        out += 'else ' + v + '\n';
    }
    out += '\bend' + (obj._alias ? ' ' + obj._alias : '');
    return out;
  }
};

/**
 * Serializes "returning"
 *
 * @param {Object} bindings
 * @param {Object} inf - Helper information
 * @return {string}
 * @protected
 */
SerializerInstance.prototype.serializeReturning = function(bindings, inf) {
  if (!bindings) return '';
  var out = '';
  var line = '';
  var k = 0;
  Object.getOwnPropertyNames(bindings).forEach(function(col) {
    const s = col;
    if (s) {
      line += (k > 0 ? ',' : '');
      if (line.length > 60) {
        out += (out ? '\n' : '') + line;
        line = '';
      } else line += line ? ' ' : '';
      line += s;
      k++;
    }
  });
  if (line)
    out += (out ? '\n' : '') + line;
  return out ? 'returning ' + out : '';
};

/**
 * Serializes conditional operator
 *
 * @param {String} operator
 * @param {Object} inf - Helper information
 * @return {string}
 * @protected
 */
SerializerInstance.prototype.serializeConditionalOperator =
    function(operator, inf) {
      switch (operator) {
        case '!like':
          return 'not like';
        case '!between':
          return 'not between';
      }
      return operator;
    };

SerializerInstance.prototype.prmGen = function() {
  return 'generated_parameter_' + this._prmGen.generator++;
};

function serializeSelect(instance, columns, inf) {
  return __serialize('serializeSelect', instance, columns, inf);
}

function serializeCase(instance, columns, inf) {
  return __serialize('serializeCase', instance, columns, inf);
}

function serializeColumns(instance, columns, inf) {
  return __serialize('serializeColumns', instance, columns, inf);
}

function serializeColumn(instance, columns, inf) {
  return __serialize('serializeColumn', instance, columns, inf);
}

function serializeConditionGroup(instance, columns, inf) {
  return __serialize('serializeConditionGroup', instance, columns, inf);
}

function serializeFrom(instance, columns, inf) {
  return __serialize('serializeFrom', instance, columns, inf);
}

function serializeJoins(instance, columns, inf) {
  return __serialize('serializeJoins', instance, columns, inf);
}

function serializeJoin(instance, columns, inf) {
  return __serialize('serializeJoin', instance, columns, inf);
}

function serializeWhere(instance, columns, inf) {
  return __serialize('serializeWhere', instance, columns, inf);
}

function serializeGroupBy(instance, columns, inf) {
  return __serialize('serializeGroupBy', instance, columns, inf);
}

function serializeOrderBy(instance, columns, inf) {
  return __serialize('serializeOrderBy', instance, columns, inf);
}

function serializeValue(instance, columns, inf) {
  return __serialize('serializeValue', instance, columns, inf);
}

function serializeRaw(instance, columns, inf) {
  return __serialize('serializeRaw', instance, columns, inf);
}

function serializeStringValue(instance, columns, inf) {
  return __serialize('serializeStringValue', instance, columns, inf);
}

function serializeDateValue(instance, columns, inf) {
  return __serialize('serializeDateValue', instance, columns, inf);
}

function serializeArrayValue(instance, columns, inf) {
  return __serialize('serializeArrayValue', instance, columns, inf);
}

function serializeUpdateValue(instance, columns, inf) {
  return __serialize('serializeUpdateValue', instance, columns, inf);
}

function serializeReturning(instance, bindings, inf) {
  return __serialize('serializeReturning', instance, bindings, inf);
}

function serializeConditionalOperator(instance, bindings, inf) {
  return __serialize('serializeConditionalOperator', instance, bindings, inf);
}

function __serialize(fnName, instance, obj, inf) {

  if (fnName instanceof SerializerInstance) {
    inf = obj;
    obj = instance;
    instance = fnName;
    if (obj !== instance.query &&
        ['select', 'insert', 'update', 'delete'].indexOf(obj.type) >= 0) {
      const sub = new SerializerInstance(instance);
      return sub.generate(obj, instance.inputValues);
    }
    fnName = ObjtypeToFunctionName[obj.type];
  }
  const extension = instance.serializerExtension;
  if (extension && extension[fnName]) {
    const out = extension[fnName](instance, obj, inf);
    if (out !== undefined)
      return out;
  }
  assert(instance[fnName], fnName + ' not found');
  return instance[fnName](obj, inf) || '';
}

const ObjtypeToFunctionName = {
  delete: 'serializeDelete',
  insert: 'serializeInsert',
  select: 'serializeSelect',
  update: 'serializeUpdate',
  case: 'serializeCase',
  conditiongroup: 'serializeConditionGroup',
  condition: 'serializeCondition',
  column: 'serializeFieldName',
  table: 'serializeTableName',
  raw: 'serializeRaw'
};

module.exports = Serializer;
