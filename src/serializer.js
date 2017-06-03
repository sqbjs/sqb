/* SQB
 ------------------------
 (c) 2017-present Panates
 SQB may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/sqb/
 */

/* Internal module dependencies. */
const StringBuilder = require('./helpers/stringbuilder');

/* External module dependencies. */
const assert = require('assert');

/* helper functions */
function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

/**
 * @class
 * @public
 */
class Serializer {

  constructor(config) {
    this.dialect = config.dialect;
    this.prettyPrint = !!config.prettyPrint;
    this.namedParams = !!config.namedParams;
    this.reservedWords = [
      'schema', 'table', 'field', 'index',
      'select', 'insert', 'update', 'delete', 'merge', 'join', 'inner', 'outer',
      'left', 'right', 'full',
      'with', 'from', 'where', 'order', 'by', 'group', 'having',
      'and', 'or', 'not', 'between', 'null', 'like',
      'count', 'sum', 'average'];

    this.objSerializers = {
      conditiongroup: this._serializeConditionGroup,
      condition: this._serializeCondition,
      raw: this._serializeRaw,
      select: this._serializeSelect,
      insert: this._serializeInsert,
      update: this._serializeUpdate,
      delete: this._serializeDelete,
      table: this._serializeTableName,
      column: this._serializeFieldName,
      case: this._serializeCase
    };
  }

  /**
   * Serializes input object to string representation
   *
   * @param {Statement} obj
   * @param {Array|Object} [values]
   * @return {{sql: string, params: (Object|Array) }}
   * @public
   */
  build(obj, values) {
    this._outParams = this.namedParams ? {} : [];
    this._outParamsCache = {};
    values = values || obj._params;
    if (values) {
      if (Array.isArray(values))
        this._inputParams = values;
      else if (typeof values === 'object') {
        // We build a new map with upper keys for case insensitivity
        const obj = {};
        Object.getOwnPropertyNames(values).forEach(
            function(key) {
              obj[key.toUpperCase()] = values[key];
            }
        );
        this._inputParams = obj;
      } else
        throw new TypeError('Invalid argument');
    }
    assert.ok(['select', 'insert', 'update', 'delete'].includes(obj.type),
        'Invalid argument');
    return {
      sql: this._serializeSqlObject(obj),
      params: this._outParams
    };
  }

  /**
   * Checks if word is reserved
   *
   * @param {string} word
   * @return {boolean}
   * @protected
   */
  _isReserved(word) {
    return word && this.reservedWords.includes(String(word).toLowerCase());
  }

  //noinspection JSUnusedLocalSymbols
  /**
   * Serialize Select statement
   *
   * @param {Select} obj Select statement object
   * @return {String}
   * @protected
   */
  _serializeSelect(obj) {
    const sb = new StringBuilder(this.prettyPrint ? 180 : 0);
    let s;

    sb.append('select');

    s = this._serializeColumns(obj._columns);
    sb.append(s ? ' ' + s : ' *');

    if ((s = this._serializeTablesNames(obj._tables))) {
      sb.append(
          (this.prettyPrint && sb.line.length > 40 ? '\n' : ' ') + 'from ' + s);
    }

    if ((s = this._serializeJoins(obj._joins))) {
      sb.indent = 2;
      sb.append((this.prettyPrint ? (sb.line ? '\n' : '') : ' ') + s);
      if (this.prettyPrint)
        sb.cr();
    }

    if ((s = this._serializeWhere(obj._where))) {
      sb.indent = 0;
      sb.append((this.prettyPrint &&
          (sb.line.length > 40 || sb.lines > 1 || s.indexOf('\n') > 0) ?
              (sb.line ? '\n' : '') : (sb.line ? ' ' : '')) + s);
      if (this.prettyPrint) sb.cr();
    }

    if ((s = this._serializeGroupBy(obj._groupby))) {
      sb.indent = 0;
      sb.append(
          (this.prettyPrint ? (sb.line ? '\n' : '') : ' ') + 'group by ' + s);
    }

    if ((s = this._serializeOrderBy(obj._orderby))) {
      sb.indent = 0;
      sb.append(
          (this.prettyPrint ? (sb.line ? '\n' : '') : ' ') + 'order by ' + s);
    }

    return sb.toString();
  }

  /**
   * Serialize Insert statement
   *
   * @param {Insert} obj Select statement object
   * @return {string}
   * @protected
   */
  _serializeInsert(obj) {
    assert.ok(['raw', 'table'].includes(obj._table.type),
        'Invalid argument. Only Raw or TableName allowed in "insert(?)"');

    const sb = new StringBuilder(this.prettyPrint ? 180 : 0);
    sb.append('insert into ');
    // table name
    sb.append(this._serializeSqlObject(obj._table));
    // columns
    sb.append(' (' + this._serializeColumns(obj._columns) + ') ');
    // values
    const objValues = obj._values || {};

    if (objValues) {
      if (['raw', 'select'].includes(objValues.type)) {
        const s = this._serializeSqlObject(objValues);
        if (s) {
          if (this.prettyPrint && objValues.type === 'select') sb.crlf();
          sb.append(s);
        }
      } else {
        sb.append('values (');
        const self = this;
        self._prmIdx = 0;

        // Iterate over columns
        obj._columns.forEach((col, idx) => {
          const field = col.field.toUpperCase();
          const val = objValues[field];
          const s = self._serializeValue(val);
          if (s)
            sb.append(s + (idx < obj._columns.length - 1 ? ', ' : ''));
        });
        sb.append(')');
      }
    }
    return sb.toString();
  }

  /**
   * Serialize Update statement
   *
   * @param {Update} obj Update statement object
   * @return {string}
   * @protected
   */
  _serializeUpdate(obj) {
    assert.ok(['raw', 'table'].includes(obj._table.type),
        'Invalid argument. Only Raw or TableName allowed in "update(?)"');
    assert.ok(!!obj._values, 'values required for Update statement');

    const self = this;
    const prettyPrint = self.prettyPrint;
    const sb = new StringBuilder(prettyPrint ? 180 : 0);

    sb.indent = 4;

    sb.append('update ');
    sb.append(this._serializeSqlObject(obj._table));
    sb.append(' set');
    if (prettyPrint)
      sb.cr();

    // Serialize update values
    if (obj._values.isRaw) {
      sb.append(' ' + self._serializeRaw(obj._values));
    } else {
      // Iterate over update values
      const values = obj._values;
      Object.getOwnPropertyNames(values).forEach(
          function(key, idx) {
            const s = self._serializeUpdateValue(key, values[key]);
            if (s)
              sb.append((idx > 0 ? ', ' : (prettyPrint ? '' : ' ')) + s);
          }
      );
    }

    // Serialize conditions
    sb.indent = 2;
    let s;
    if ((s = this._serializeWhere(obj._where))) {
      sb.indent = 0;
      sb.append((prettyPrint && (sb.line.length > 40 || sb.lines > 1) ?
              (sb.line ? '\n' : '') :
              (sb.line ? ' ' : '')) + s);
      if (prettyPrint) sb.cr();
    }

    return sb.toString();
  }

  /**
   * Serialize Delete statement
   *
   * @param {Delete} obj Delete statement object
   * @return {string}
   * @protected
   */
  _serializeDelete(obj) {
    assert.ok(['raw', 'table'].includes(obj._table.type),
        'Invalid argument. Only Raw or TableName allowed in "delete(?)"');
    const self = this;
    const prettyPrint = self.prettyPrint;
    const sb = new StringBuilder(prettyPrint ? 180 : 0);
    sb.indent = 4;
    sb.append('delete from ');
    sb.append(this._serializeSqlObject(obj._table));

    // Serialize conditions
    sb.indent = 2;
    let s;
    if ((s = this._serializeWhere(obj._where))) {
      sb.indent = 0;
      sb.append((prettyPrint && (sb.line.length > 40 || sb.lines > 1) ?
              (sb.line ? '\n' : '') :
              (sb.line ? ' ' : '')) + s);
      if (prettyPrint) sb.cr();
    }

    return sb.toString();
  }

  //noinspection JSMethodCanBeStatic,JSUnusedLocalSymbols
  /**
   * Serialize Raw object
   *
   * @param {Raw} raw
   * @return {string}
   * @protected
   */
  // eslint-disable-next-line
  _serializeRaw(raw) {
    return raw ? raw.text || '' : '';
  }

  //noinspection JSUnusedLocalSymbols
  /**
   * Serializes array of column names comes after 'Select'
   *
   * @param {Array<Column>} columns
   * @return {string}
   * @protected
   */
  _serializeColumns(columns) {
    if (!(columns && columns.length)) return '';
    const sb = new StringBuilder(this.prettyPrint ? undefined : 0);
    sb.indent += 4;
    for (const col of columns) {
      const s = this._serializeColumn(col);
      if (s) {
        if (sb.line) sb.append(', ', true);
        sb.append(s);
      }
    }
    return sb.toString();
  }

  /**
   * Serializes array of column names comes after 'Select'
   *
   * @param {Column} column
   * @return {string}
   * @protected
   */
  _serializeColumn(column) {
    if (!column) return '';
    assert.ok(['column', 'raw', 'case', 'select'].includes(column.type),
        'Invalid object for serializing column');
    const s = this._serializeSqlObject(column);
    //noinspection JSUnresolvedVariable
    return column.type === 'select' ?
        '(' + s + ')' + (column._alias ?
            ' ' + (this._isReserved(column._alias) ? '"' + column._alias +
                '"' : column._alias) : '') :
        s;
  }

  //noinspection JSMethodCanBeStatic,JSUnusedLocalSymbols
  /**
   * Serializes single column name
   *
   * @param {Column} field
   * @return {string}
   * @protected
   */
  _serializeFieldName(field) {
    return (field.table ? field.table + '.' : '') + field.field +
        (field.alias ? ' ' +
            (this._isReserved(field.alias) ? '"' + field.alias +
                '"' : field.alias) : '');
  }

  //noinspection JSUnusedLocalSymbols
  /**
   * Serializes tables names comes after 'From'
   *
   * @param {Array<SqlObject>} tables
   * @return {string}
   * @protected
   */
  _serializeTablesNames(tables) {
    if (!(tables && tables.length)) return '';
    let str = '';
    for (const item of tables) {
      let ss;
      assert.ok(['raw', 'select', 'table'].includes(item.type),
          'Invalid object used as Table Name');
      if ((ss = this._serializeSqlObject(item))) {
        if (item.type === 'select') { //noinspection JSUnresolvedVariable
          ss = '(' + ss + ')' + (item._alias ? ' ' + item._alias : '');
        }
        str += (str ? ', ' : '') + ss;
      }
    }
    return str;
  }

  //noinspection JSMethodCanBeStatic,JSUnusedLocalSymbols
  /**
   * Serializes single table name
   *
   * @param {TableName} table
   * @return {string}
   * @protected
   */
  _serializeTableName(table) {
    return (table.schema ? table.schema + '.' : '') +
        table.table +
        (table.alias ? ' ' + table.alias : '');
  }

  //noinspection JSUnusedLocalSymbols
  /**
   * Serializes single table name
   *
   * @param {ConditionGroup} group
   * @return {string}
   * @protected
   */
  _serializeWhere(group) {
    const s = this._serializeConditionGroup(group);
    return s ? 'where ' + s : '';
  }

  //noinspection JSUnusedLocalSymbols
  /**
   * Serializes condition group
   *
   * @param {ConditionGroup} group
   * @return {string}
   * @protected
   */
  _serializeConditionGroup(group) {
    if (!group) return '';
    const sb = new StringBuilder(this.prettyPrint ? undefined : 0);
    let s;
    let logop = 'and';
    sb.indent += 4;
    for (let i = 0; i < group.length; i++) {
      const item = group.item(i);
      assert.ok(['raw', 'conditiongroup', 'condition'].includes(item.type),
          'Invalid object used as Condition');
      logop = item.logicalOperator || logop;
      if ((s = this._serializeSqlObject(item))) {
        if (item.type === 'conditiongroup') s = '(' + s + ')';
        sb.append((sb.line ? ' ' + logop + ' ' : '') + s);
      }
    }
    return sb.toString();
  }

  //noinspection JSUnusedLocalSymbols
  /**
   * Serializes condition
   *
   * @param {Condition} item
   * @return {string}
   * @protected
   */
  _serializeCondition(item) {
    let str;
    if (['raw', 'select'].includes(item.field.type)) {
      str = (str = this._serializeSqlObject(item.field)) &&
      item.field.type === 'select' ?
          '(' + str + ')' : str;
    } else
      str = this._isReserved(item.field) ? '"' + item.field + '"' : item.field;

    const outParams = this._outParams;
    let operator = item.operator.toLowerCase();
    let s;
    let prm;
    let inputprm;
    let inputIsArray;
    if (item.param) {
      prm = item.param.toUpperCase();
      inputprm = this._inputParams ? this._inputParams[prm] : null;
      inputIsArray = Array.isArray(inputprm);
    }

    if (operator === 'between') {
      if (prm) {
        if (this.namedParams) {
          s = ':' + prm + '1 and :' + prm + '2';
          outParams[prm + '1'] = inputIsArray ? inputprm[0] : inputprm;
          outParams[prm + '2'] = inputIsArray ? inputprm[1] : null;
        } else {
          s = '? and ?';
          outParams.push(inputIsArray ? inputprm[0] : inputprm);
          outParams.push(inputIsArray ? inputprm[1] : null);
        }
      } else {
        s = this._serializeValue(item.value[0]) + ' and ' +
            this._serializeValue(item.value[1]);
      }

    } else if (operator === 'like' && !prm && Array.isArray(item.value) &&
        (s = item.value.join()) && ((s.includes('%')) || s.includes('?'))) {
      s = '(';
      item.value.forEach((v, i) => {
        s += (i > 0 ? ' or ' : '') + str + ' like ' +
            this._serializeValue(String(v));
      });
      return s + ')';

    } else if (prm) {
      if (this.namedParams) {
        s = ':' + prm;
        outParams[prm] = inputprm;
      } else {
        s = '?';
        outParams.push(inputprm);
      }
    } else {
      s = this._serializeValue(item.value);
      if (s.startsWith('(')) {
        if (['!=', '<>', ' not like'].includes(operator)) operator = 'not in';
        else operator = 'in';
      }
    }

    if (s)
      str += ' ' + operator + ' ' + s;
    return str;
  }

  //noinspection JSUnusedLocalSymbols
  /**
   * Serializes any value
   *
   * @param {*} val
   * @return {string}
   * @protected
   */
  _serializeValue(val) {
    if (val === null || val === undefined)
      return 'null';

    if (val instanceof RegExp) {
      const prm = val.source.toUpperCase();
      const inputParams = this._inputParams;
      let x = this._outParamsCache[prm];

      if (x === undefined) {
        if (Array.isArray(inputParams)) {
          x = this._prmIdx < inputParams.length ?
              inputParams[this._prmIdx++] :
              null;
        } else if (typeof inputParams === 'object')
          x = inputParams[prm] || null;
        this._outParamsCache[prm] = x;
      }

      if (this.namedParams) {
        this._outParams[prm] = x;
        return ':' + prm;
      } else {
        this._outParams.push(x);
        return '?';
      }
    }
    if (val.isRaw)
      return this._serializeRaw(val);
    if (typeof val === 'string')
      return this._serializeStringValue(val);
    if (isNumeric(val))
      return String(val);
    if (val instanceof Date)
      return this._serializeDateValue(val);
    if (Array.isArray(val))
      return this._serializeArrayValue(val);
    return this._serializeStringValue(String(val));
  }

  //noinspection JSMethodCanBeStatic, JSUnusedLocalSymbols
  /**
   * Serializes string value
   *
   * @param {string} val
   * @return {string}
   * @protected
   */
  _serializeStringValue(val) {
    return '\'' + (val || '').replace('\'', '\'\'') + '\'';
  }

  //noinspection JSMethodCanBeStatic, JSUnusedLocalSymbols
  /**
   * Serializes Date value
   *
   * @param {Date} date
   * @return {string}
   * @protected
   */
  _serializeDateValue(date) {
    const d = date.getDate();
    const m = date.getMonth() + 1;
    const y = date.getFullYear();
    const h = date.getHours();
    const n = date.getMinutes();
    const s = date.getSeconds();
    let str = y + '-' + (m <= 9 ? '0' + m : m) + '-' + (d <= 9 ? '0' + d : d);
    if (h || n || s)
      str += ' ' + (h <= 9 ? '0' + h : h) + ':' +
          (n <= 9 ? '0' + n : n) + ':' +
          (s <= 9 ? '0' + s : s);
    return '\'' + str + '\'';
  }

  //noinspection JSUnusedLocalSymbols
  /**
   * Serializes Array value
   *
   * @param {Array} arr
   * @return {string}
   * @protected
   */
  _serializeArrayValue(arr) {
    let str = '';
    for (let i = 0; i < arr.length; i++) {
      str += (str ? ',' : '') + this._serializeValue(arr[i]);
    }
    return str ? '(' + str + ')' : '';
  }

  /**
   * Serializes array of Joins
   *
   * @param {Array<Join>} joins
   * @return {string}
   * @protected
   */
  _serializeJoins(joins) {
    if (!joins) return '';
    const sb = new StringBuilder(this.prettyPrint ? undefined : 0);
    for (let i = 0; i < joins.length; i++) {
      const s = this._serializeJoin(joins[i]);
      if (s) {
        sb.append(s);
        if (this.prettyPrint)
          sb.crlf();
        else sb.append(i < joins.length - 1 ? ' ' : '');
      }
    }
    return sb.toString();
  }

  /**
   * Serializes single Join
   *
   * @param {Join} join
   * @return {string}
   * @protected
   */
  _serializeJoin(join) {
    const sb = new StringBuilder(this.prettyPrint ? undefined : 0);
    sb.indent = 4;
    let s;
    switch (join.joinType) {
      case 1:
        s = 'left join';
        break;
      case 2:
        s = 'left outer join';
        break;
      case 3:
        s = 'right join';
        break;
      case 4:
        s = 'right outer join';
        break;
      case 5:
        s = 'outer join';
        break;
      case 6:
        s = 'full outer join';
        break;
      default:
        s = 'inner join';
        break;
    }
    sb.append(s);

    assert.ok(['raw', 'select', 'table'].includes(join.table.type),
        'Invalid object used as Table Name');
    if ((s = this._serializeSqlObject(join.table))) {
      if (join.table.type === 'select') {
        s = '(' + s + ')' + (join.table._alias ? ' ' + join.table._alias : '');
      }
      sb.append(' ' + s);
    }

    s = this._serializeConditionGroup(join.conditions);
    if (s)
      sb.append(' on ' + s);
    return sb.toString();
  }

  /**
   * Serializes array of 'group by' columns
   *
   * @param {Array<Column>} columns
   * @return {string}
   * @protected
   */
  _serializeGroupBy(columns) {
    return this._serializeColumns(columns);
  }

  /**
   * Serializes array of 'order by' columns
   *
   * @param {Array<Order>} columns
   * @return {string}
   * @protected
   */
  _serializeOrderBy(columns) {
    const sb = new StringBuilder(this.prettyPrint ? undefined : 0);
    let o;
    sb.indent = 4;
    for (let i = 0; i < columns.length; i++) {
      o = columns[i];
      let s;
      if (o.isRaw)
        s = this._serializeRaw(o);
      else s = (o.table ? o.table + '.' : '') + o.field +
          (o.descending ? ' desc' : '');

      if (s) {
        if (i) sb.append(', ');
        sb.append(s);
      }
    }
    return sb.toString();
  }

  /**
   * Serializes single value for Update statement
   *
   * @param {string} key
   * @param {*} value
   * @return {string}
   * @protected
   */
  _serializeUpdateValue(key, value) {
    let s;
    if (value instanceof RegExp) {
      const x = this._inputParams ? this._inputParams[key] : null;
      if (this.namedParams) {
        s = ':' + key;
        this._outParams[key] = x;
      } else {
        s = '?';
        this._outParams.push(x);
      }
    } else
      s = this._serializeValue(value);
    return (key + ' = ' + s);
  }

  //noinspection JSUnusedLocalSymbols
  /**
   * Serializes Case expression
   *
   * @param {Case} obj
   * @return {string}
   * @protected
   */
  _serializeCase(obj) {
    if (obj._expressions.length) {
      const self = this;
      const sb = new StringBuilder(this.prettyPrint ? undefined : 0);
      sb.indent = 4;
      sb.append('case');

      for (const item of obj._expressions) {
        assert.ok(['conditiongroup', 'condition', 'raw'].includes(
            item.condition.type),
            'Invalid object used in "case" expression');
        const s = self._serializeSqlObject(item.condition);
        if (s)
          sb.append(
              ' when ' + s + ' then ' + (self._serializeValue(item.value)) ||
              'null');
      }

      if (obj._elseValue !== undefined) {
        const s = self._serializeValue(obj._elseValue);
        if (s)
          sb.append(' else ' + s);
      }
      sb.append(' end' + (obj._alias ? ' ' + obj._alias : ''));
      return sb.toString();
    }
  }

  //noinspection JSUnusedLocalSymbols
  /**
   * Serializes Case expression
   *
   * @param {SqlObject} obj
   * @return {string}
   * @protected
   */
  _serializeSqlObject(obj) {
    if (obj) {
      const fn = this.objSerializers[obj.type];
      return fn ? fn.call(this, obj) : '';
    }
  }
}

/**
 * Registers a serializer class for given dialect
 *
 * @param {String} dialect
 * @param {constructor<Serializer>} serializerProto
 * @static
 * @public
 */
Serializer.register = function(dialect, serializerProto) {
  const items = this._registry = this._registry || {};
  items[dialect] = serializerProto;
};

/**
 * Retrieves serializer class for given dialect
 *
 * @param {String} dialect
 * @return {constructor<Serializer>}
 * @static
 * @public
 */
Serializer.get = function(dialect) {
  return this._registry ? this._registry[dialect] : undefined;
};

/**
 * Creates serializer for given dialect/config
 *
 * @param {String|Object} config
 * @return {Serializer}
 * @static
 * @public
 */
Serializer.create = function(config) {
  if (config instanceof Serializer) {
    //noinspection JSValidateTypes
    return config;
  }

  config = typeof config === 'string' ?
      {dialect: config} :
      typeof config === 'object' ?
          config :
          {};

  if (!config.dialect || config.dialect === 'generic')
    return new Serializer(config);

  const Clazz = this.get(config.dialect);
  if (Clazz) {
    //noinspection JSValidateTypes
    return new Clazz(config);
  } else throw new Error(`Dialect "${config.dialect}" is not registered`);
};

module.exports = Serializer;
