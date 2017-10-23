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
const plugins = require('./plugins');
const assert = require('assert');
const flattenText = require('putil-flattentext');

/**
 * Module functions
 * @private
 */

function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

/**
 * Expose `Serializer`.
 */
module.exports = Serializer;

/**
 * @param {Object} config
 * @constructor
 * @public
 */
function Serializer(config) {
  config = typeof config === 'object' ? config : {dialect: config};
  const self = this;
  self._config = config;
  self._prmGen = 1;
  this.pluginSerializer = plugins.createSerializer(self._config);
}

const proto = Serializer.prototype = {
  // noinspection JSMethodCanBeStatic
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

  get namedParams() {
    return this._config.namedParams;
  },

  set namedParams(val) {
    this._config.namedParams = val;
  },

  get strictParams() {
    return this._config.strictParams;
  },

  set strictParams(value) {
    this._config.strictParams = value;
  }
};
proto.constructor = Serializer;

/**
 * Serializes input object to string representation
 *
 * @param {Query} query
 * @param {Array|Object} [inputValues]
 * @return {{sql: string, params: (Object|Array) }}
 * @public
 */
proto.generate = function(query, inputValues) {
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
    this.prmGen = owner.prmGen;
  } else {
    this.config = Object.assign({}, owner._config);
    this.outParams = owner.namedParams ? {} : [];
    this.outParamsCache = {};
    this.prmGen = {generator: 0};
    this.reservedWords = [
      'schema', 'table', 'field', 'index', 'acs', 'ascending', 'dsc',
      'descending', 'distinct',
      'select', 'insert', 'update', 'delete',
      'merge', 'join', 'inner', 'outer', 'left', 'right', 'full',
      'with', 'from', 'where', 'order', 'by', 'group', 'having',
      'and', 'or', 'not', 'between', 'null', 'like',
      'count', 'sum', 'average'];
  }
  this.pluginSerializer = owner.pluginSerializer;
}

const proto2 = SerializerInstance.prototype = {};
proto2.constructor = SerializerInstance;

/**
 *
 * @param {String} s
 * @return {boolean}
 */
proto2.isReserved = function(s) {
  s = String(s).toLowerCase();
  if (this.reservedWords.indexOf(s) >= 0)
    return true;
  if (this.pluginSerializer &&
      typeof this.pluginSerializer.isReserved === 'function')
    return this.pluginSerializer.isReserved(s);
};

/**
 *
 * @param {Query} query
 * @param {...*} inputValues
 * @return {string}
 */
proto2.generate = function(query, inputValues) {
  this.query = query;
  this.inputValues = inputValues;
  const sql = __serialize(this, this.query);
  return flattenText(sql, {noWrap: !this.config.prettyPrint});
};

//noinspection JSUnusedLocalSymbols
/**
 * Serialize Select query
 *
 * @param {SelectQuery} query Select query object
 * @return {String}
 * @protected
 */
proto2.serializeSelect = function(query) {
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
proto2.serializeInsert = function(query) {
  assert.ok(query && query._table &&
      ['raw', 'table'].indexOf(query._table.type) >= 0,
      'Invalid argument. Only Raw or TableName allowed in "insert(?)"');
  assert.ok(!!query._values, 'values required for Insert query');

  const self = this;
  var out = 'insert into ' +
      __serialize(self, query._table, {section: 'insert.table'}) +
      ' (' +
      serializeColumns(self, query._columns, {section: 'insert.columns'}) +
      ')';

  // values
  const objValues = query._values;
  var s;
  if (objValues) {
    if (['raw', 'select'].indexOf(objValues.type) >= 0) {
      s = __serialize(self, objValues, {section: 'insert.values'});
      if (s)
        out += (objValues.type === 'select' ? '\n' : ' ') + s;

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
        s = serializeValue(self, val, iinf);
        if (s)
          out += (idx ? ', ' : '') + s;
      });
      out += ')';
    }
  }
  if (query._returning) {
    s = serializeReturning(self, query._returning,
        {section: 'insert.returning'});
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
proto2.serializeUpdate = function(query) {
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
proto2.serializeDelete = function(query) {
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

//noinspection JSUnusedLocalSymbols,JSUnusedGlobalSymbols
/**
 * Serializes array of column names comes after 'Select'
 *
 * @param {Array<Column>} columns
 * @param {Object} inf - Helper information
 * @return {string}
 * @protected
 */
proto2.serializeColumns = function(columns, inf) {
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

// noinspection JSUnusedGlobalSymbols
/**
 * Serializes array of column names comes after 'Select'
 *
 * @param {Column} column
 * @param {Object} inf - Helper information
 * @return {string}
 * @protected
 */
proto2.serializeColumn = function(column, inf) {
  if (!column) return '';
  assert.ok(['column', 'raw', 'case', 'select'].indexOf(column.type) >= 0,
      'Invalid object for serializing column');
  const s = __serialize(this, column, inf);
  //noinspection JSUnresolvedVariable
  return column.type === 'select' ?
      '(' + s + ')' + (column._alias ?
      ' ' + (this.isReserved(column._alias) ? '"' + column._alias +
      '"' : column._alias) : '') :
      s;
};

//noinspection JSMethodCanBeStatic,JSUnusedLocalSymbols
/**
 * Serializes single field name
 *
 * @param {Column} field
 * @param {Object} inf - Helper information
 * @return {string}
 * @protected
 */
proto2.serializeFieldName = function(field, inf) {
  return (field.table ? field.table + '.' : '') + field.field +
      (field.alias ? ' ' +
          (this.isReserved(field.alias) ? '"' + field.alias +
              '"' : field.alias) : '');
};

//noinspection JSUnusedLocalSymbols,JSUnusedGlobalSymbols
/**
 * Serializes tables names comes after 'From'
 *
 * @param {Array<SqlObject>} tables
 * @param {Object} inf - Helper information
 * @return {string}
 * @protected
 */
proto2.serializeFrom = function(tables, inf) {
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
      if (item.type === 'select') { //noinspection JSUnresolvedVariable
        s = '(' + (lf ? '\n\t' : '') + s + ')' + (lf ? '\b' : '') +
            (item._alias ? ' ' + item._alias : '');
      }
      out += (out ? ', ' : ' ') + s;
    }
    iinf.index++;
  });
  return out ? 'from' + out : '';
};

//noinspection JSUnusedLocalSymbols,JSUnusedGlobalSymbols
/**
 * Serializes array of Joins
 *
 * @param {Array<Join>} joins
 * @param {Object} inf - Helper information
 * @return {string}
 * @protected
 */
proto2.serializeJoins = function(joins, inf) {
  if (!joins || !joins.length) return '';
  const self = this;
  var out = '';
  const iinf = {section: 'joins', index: 0};
  joins.forEach(function(j) {
    const s = serializeJoin(self, j, iinf);
    if (s)
      out += (out ? '\n' : '') + s;
    iinf.index++;
  });
  return out;
};

//noinspection JSUnusedLocalSymbols,JSUnusedGlobalSymbols
/**
 * Serializes single Join
 *
 * @param {Join} join
 * @param {Object} inf - Helper information
 * @return {string}
 * @protected
 */
proto2.serializeJoin = function(join, inf) {
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

//noinspection JSMethodCanBeStatic,JSUnusedLocalSymbols
/**
 * Serialize Raw object
 *
 * @param {Raw} raw
 * @param {Object} inf - Helper information
 * @return {string}
 * @protected
 */
// eslint-disable-next-line
proto2.serializeRaw = function(raw, inf) {
  return raw ? raw.text || '' : '';
};

//noinspection JSMethodCanBeStatic,JSUnusedLocalSymbols
/**
 * Serializes single table name
 *
 * @param {TableName} table
 * @param {Object} inf - Helper information
 * @return {string}
 * @protected
 */
proto2.serializeTableName = function(table, inf) {
  return (table.schema ? table.schema + '.' : '') +
      table.table +
      (table.alias ? ' ' + table.alias : '');
};

//noinspection JSUnusedLocalSymbols,JSUnusedGlobalSymbols
/**
 * Serializes single table name
 *
 * @param {ConditionGroup} group
 * @param {Object} inf - Helper information
 * @return {string}
 * @protected
 */
proto2.serializeWhere = function(group, inf) {
  const s = serializeConditionGroup(this, group, inf);
  return s ? 'where ' + s : '';
};

//noinspection JSUnusedLocalSymbols
/**
 * Serializes condition group
 *
 * @param {ConditionGroup} group
 * @param {Object} inf - Helper information
 * @return {string}
 * @protected
 */
proto2.serializeConditionGroup = function(group, inf) {
  if (!group || !group.length) return '';
  const self = this;
  var out = '';
  var line = '';
  var logop = 'and';
  var k = 0;
  var lf = 0;
  const iinf = {section: 'conditiongroup', index: 0};

  group._items.forEach(function(item) {
    assert.ok(['raw', 'conditiongroup', 'condition'].indexOf(item.type)>=0,
        'Invalid object used as Condition');
    logop = item.logicalOperator || logop;
    var s = __serialize(self, item, iinf);
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
  if (line)
    out += (out ? '\n' + (lf === 1 ? '\t' : '') : '') + line;
  return out + (lf >= 1 ? '\b' : '');
};

//noinspection JSUnusedLocalSymbols
/**
 * Serializes condition
 *
 * @param {Condition} item
 * @param {Object} inf - Helper information
 * @return {string}
 * @protected
 */
proto2.serializeCondition = function(item, inf) {
  const self = this;
  var str;
  if (['raw', 'select'].indexOf(item.field.type)>=0) {
    str = (str = __serialize(self, item.field, inf)) &&
    item.field.type === 'select' ?
        '(' + str + ')' : str;
  } else
    str = self.isReserved(item.field) ? '"' + item.field + '"' : item.field;

  const outParams = self.outParams;
  var operator = item.operator.toLowerCase();
  var s;
  var prm;
  var prmValue;
  if (item.param) {
    prm = item.param;
    prmValue = self.inputValues && self.inputValues[prm];
  } else if (self.strictParams && !item.value.isSqlObject) {
    prm = self.prmGen();
    prmValue = item.value;
  }

  if (operator === 'between') {
    if (prm) {
      const valIsArray = Array.isArray(prmValue);
      if (self.config.namedParams) {
        s = ':' + prm + '1 and :' + prm + '2';
        outParams[prm + '1'] = valIsArray ? prmValue[0] : prmValue;
        outParams[prm + '2'] = valIsArray ? prmValue[1] : null;
      } else {
        s = '? and ?';
        outParams.push(valIsArray ? prmValue[0] : prmValue);
        outParams.push(valIsArray ? prmValue[1] : null);
      }
    } else {
      s = serializeValue(self, item.value[0], inf) + ' and ' +
          serializeValue(self, item.value[1], inf);
    }

  } else if ((operator === 'like' || operator === '!like' ||
          operator === 'not like') && !prm &&
      Array.isArray(item.value) &&
      (s = item.value.join()) && ((s.indexOf('%')>=0) || s.indexOf('?')>=0)) {
    s = '(';
    item.value.forEach(function(v, i) {
      s += (i > 0 ? ' or ' : '') + str + ' ' +
          (operator === '!like' ? 'not like' : operator) + ' ' +
          serializeValue(self, String(v), inf);
    });
    return s + ')';

  } else if (prm) {
    if (self.config.namedParams) {
      s = ':' + prm;
      outParams[prm] = prmValue;
    } else {
      s = '?';
      outParams.push(prmValue);
    }
  } else {
    s = serializeValue(self, item.value, inf);
    if (s.startsWith('(')) {
      if (['!=', '<>', ' not like'].indexOf(operator)>=0) operator = 'not in';
      else operator = 'in';
    }
  }

  if (s)
    str += ' ' + operator + ' ' + s;
  return str;
};

//noinspection JSUnusedLocalSymbols,JSUnusedGlobalSymbols
/**
 * Serializes any value
 *
 * @param {*} val
 * @param {Object} inf - Helper information
 * @return {string}
 * @protected
 */
proto2.serializeValue = function(val, inf) {
  if (val === null || val === undefined)
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
        x = inputValues[prm] || null;
      self.outParamsCache[prm] = x;
    }

    if (self.config.namedParams) {
      self.outParams[prm] = x;
      return ':' + prm;
    } else {
      self.outParams.push(x);
      return '?';
    }
  }
  if (val.isRaw)
    return serializeRaw(self, val, inf);
  if (val.type === 'select') {
    const s = serializeSelect(self, val);
    return s ? '(' + s + ')' : 'null';
  }
  if (val.type === 'case') {
    const s = serializeCase(self, val);
    return s ? '(' + s + ')' : 'null';
  }
  if (typeof val === 'string')
    return serializeStringValue(self, val, inf);
  if (isNumeric(val))
    return String(val);
  if (val instanceof Date)
    return serializeDateValue(self, val, inf);
  if (Array.isArray(val))
    return serializeArrayValue(self, val, inf);
  return serializeStringValue(self, String(val), inf);
};

//noinspection JSMethodCanBeStatic, JSUnusedLocalSymbols,JSUnusedGlobalSymbols
/**
 * Serializes string value
 *
 * @param {string} val
 * @param {Object} inf - Helper information
 * @return {string}
 * @protected
 */
proto2.serializeStringValue = function(val, inf) {
  return '\'' + (val || '').replace('\'', '\'\'') + '\'';
};

//noinspection JSMethodCanBeStatic, JSUnusedLocalSymbols,JSUnusedGlobalSymbols
/**
 * Serializes Date value
 *
 * @param {Date} date
 * @param {Object} inf - Helper information
 * @return {string}
 * @protected
 */
proto2.serializeDateValue = function(date, inf) {
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

//noinspection JSUnusedLocalSymbols,JSUnusedGlobalSymbols
/**
 * Serializes Array value
 *
 * @param {Array} arr
 * @param {Object} inf - Helper information
 * @return {string}
 * @protected
 */
proto2.serializeArrayValue = function(arr, inf) {
  var str = '';
  const self = this;
  arr.forEach(function(s) {
    str += (str ? ',' : '') + serializeValue(self, s, inf);
  });
  return str ? '(' + str + ')' : '';
};

//noinspection JSUnusedLocalSymbols,JSUnusedGlobalSymbols
/**
 * Serializes array of 'group by' columns
 *
 * @param {Array<Column>} columns
 * @param {Object} inf - Helper information
 * @return {string}
 * @protected
 */
proto2.serializeGroupBy = function(columns, inf) {
  return serializeColumns(this, columns, {section: 'groupby'});
};

//noinspection JSUnusedLocalSymbols,JSUnusedGlobalSymbols
/**
 * Serializes array of 'order by' columns
 *
 * @param {Array<Order>} columns
 * @param {Object} inf - Helper information
 * @return {string}
 * @protected
 */
proto2.serializeOrderBy = function(columns, inf) {
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

// noinspection JSUnusedGlobalSymbols
/**
 * Serializes single value for Update query
 *
 * @param {string} key
 * @param {*} value
 * @param {Object} inf - Helper information
 * @return {string}
 * @protected
 */
proto2.serializeUpdateValue = function(key, value, inf) {
  const self = this;
  var s;
  if (value instanceof RegExp) {
    const x = self.inputValues && self.inputValues[key];
    if (self.config.namedParams) {
      s = ':' + key;
      self.outParams[key] = x;
    } else {
      s = '?';
      self.outParams.push(x);
    }
  } else
    s = serializeValue(self, value, inf);
  return (key + ' = ' + s);
};

//noinspection JSUnusedLocalSymbols
/**
 * Serializes Case expression
 *
 * @param {Case} obj
 * @param {Object} inf - Helper information
 * @return {string}
 * @protected
 */
proto2.serializeCase = function(obj, inf) {
  if (obj._expressions.length) {
    const self = this;
    var out = 'case\n\t';

    const iinf = {section: 'case', index: 0};
    obj._expressions.forEach(function(item) {
      assert.ok(['conditiongroup', 'condition', 'raw'].indexOf(
          item.condition.type)>=0,
          'Invalid object used in "case" expression');
      const s = __serialize(self, item.condition, iinf);
      if (s)
        out += 'when ' + s + ' then ' +
            (serializeValue(self, item.value, iinf) || 'null') + '\n';
      iinf.index++;
    });

    iinf.index = 'else';
    if (obj._elseValue !== undefined) {
      const s = serializeValue(self, obj._elseValue, iinf);
      if (s)
        out += 'else ' + s + '\n';
    }
    out += '\bend' + (obj._alias ? ' ' + obj._alias : '');
    return out;
  }
};

//noinspection JSUnusedLocalSymbols,JSUnusedGlobalSymbols
/**
 * Serializes "returning"
 *
 * @param {Object} bindings
 * @param {Object} inf - Helper information
 * @return {string}
 * @protected
 */
proto2.serializeReturning = function(bindings, inf) {
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

proto2.prmGen = function() {
  return 'generated_parameter_' + this.prmGen.generator++;
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

function __serialize(fnName, instance, obj, inf) {

  if (fnName instanceof SerializerInstance) {
    inf = obj;
    obj = instance;
    instance = fnName;
    if (obj !== instance.query &&
        ['select', 'insert', 'update', 'delete'].indexOf(obj.type)>=0) {
      const sub = new SerializerInstance(instance);
      return sub.generate(obj, instance.inputValues);
    }
    fnName = ObjtypeToFunctionName[obj.type];
  }
  const plugin = instance.pluginSerializer;
  if (plugin && plugin[fnName]) {
    const out = plugin[fnName](instance, obj, inf);
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
