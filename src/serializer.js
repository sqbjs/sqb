/* SQB
 ------------------------
 (c) 2017-present Panates
 SQB may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/sqb/
 */

/* Internal module dependencies. */
const StringBuilder = require('./helpers/clausebuilder');

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
    const self = this;
    if (config instanceof Serializer)
      self.parent = config.parent;
    else
      self.config = config;

    self._reservedWords = [
      'schema', 'table', 'field', 'index', 'acs', 'ascending', 'dsc',
      'descending', 'distinct',
      'select', 'insert', 'update', 'delete',
      'merge', 'join', 'inner', 'outer', 'left', 'right', 'full',
      'with', 'from', 'where', 'order', 'by', 'group', 'having',
      'and', 'or', 'not', 'between', 'null', 'like',
      'count', 'sum', 'average'];

    self.objSerializers = {
      conditiongroup: self._serializeConditionGroup,
      condition: self._serializeCondition,
      raw: self._serializeRaw,
      select: self._serializeSelect,
      insert: self._serializeInsert,
      update: self._serializeUpdate,
      delete: self._serializeDelete,
      table: self._serializeTableName,
      column: self._serializeFieldName,
      case: self._serializeCase
    };
  }

  get dialect() {
    return this.parent ? this.parent.dialect : this.config.dialect;
  }

  get prettyPrint() {
    return this.parent ? this.parent.prettyPrint : this.config.prettyPrint;
  }

  get namedParams() {
    return this.parent ? this.parent.namedParams : this.config.namedParams;
  }

  get reservedWords() {
    return this.parent ? this.parent.reservedWords : this._reservedWords;
  }

  set reservedWords(value) {
    if (this.parent) this.parent.reservedWords = value;
    else this._reservedWords = value;
  }

  get outParams() {
    return this.parent ? this.parent.outParams : this._outParams;
  }

  get outParamsCache() {
    return this.parent ? this.parent.outParamsCache : this._outParamsCache;
  }

  /**
   * Serializes input object to string representation
   *
   * @param {Statement} statement
   * @param {Array|Object} [values]
   * @return {{sql: string, params: (Object|Array) }}
   * @public
   */
  build(statement, values) {
    // Only statements can be built
    assert.ok(['select', 'insert', 'update', 'delete'].includes(statement.type),
        'Invalid argument');

    this._outParams = this.namedParams ? {} : [];
    this._outParamsCache = {};

    // Store input parameters in to instance value
    values = values || statement._params;
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
    return {
      sql: this._serializeSqlObject(statement, {}),
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
    const self = this;
    const sb = new StringBuilder(self.prettyPrint ? 180 : 0);
    let s;

    sb.append('select');

    s = self._serializeColumns(obj._columns, {section: 'select.columns'});
    sb.append(s ? s : '*');

    s = self._serializeTablesNames(obj._tables, {section: 'select.from'});
    if (s) {
      sb.append('from ' + s, {
        newLine: self.prettyPrint && sb.line.length > 40
      });
    }

    s = self._serializeJoins(obj._joins, {section: 'select.joins'});
    if (s) {
      sb.indent = 2;
      sb.append(s, {newLine: self.prettyPrint});
      sb.indent = 0;
      if (self.prettyPrint)
        sb.cr();
    }

    s = self._serializeWhere(obj._where, {section: 'select.where'});
    if (s) {
      sb.append(s, {
        newLine: (sb.line.length > 40 || sb.lines > 1 || s.includes('\n'))
      });
      if (self.prettyPrint) sb.cr();
    }

    s = self._serializeGroupBy(obj._groupby, {section: 'select.groupby'});
    if (s) {
      sb.append('group by ' + s, {newLine: self.prettyPrint});
    }

    s = self._serializeOrderBy(obj._orderby, {section: 'select.orderby'});
    if (s) {
      sb.append('order by ' + s, {newLine: self.prettyPrint});
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

    const self = this;
    const sb = new StringBuilder(self.prettyPrint ? 180 : 0);

    sb.append('insert into');
    // table name
    sb.append(self._serializeSqlObject(obj._table, {section: 'insert.table'}));
    // columns
    sb.append('(' +
        self._serializeColumns(obj._columns, {section: 'insert.columns'}) +
        ')');
    // values
    const objValues = obj._values || {};

    if (objValues) {
      if (['raw', 'select'].includes(objValues.type)) {
        const s = self._serializeSqlObject(objValues, {section: 'insert.values'});
        if (s) {
          if (self.prettyPrint && objValues.type === 'select') sb.crlf();
          sb.append(s);
        }
      } else {
        sb.append('values (');
        self._prmIdx = 0;

        // Iterate over columns
        const iinf = {
          section: 'insert.values',
          index: 0
        };
        obj._columns.forEach((col, idx) => {
          const field = col.field.toUpperCase();
          const val = objValues[field];
          iinf.index = idx;
          const s = self._serializeValue(val, iinf);
          if (s)
            sb.append((idx ? ', ' : '') + s, {spacing: false});
        });
        sb.append(')', {spacing: false});
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

    sb.append('update');
    sb.append(self._serializeSqlObject(obj._table, {section: 'update.table'}));
    sb.append('set');
    if (prettyPrint)
      sb.cr();

    // Serialize update values
    if (obj._values.isRaw) {
      sb.append(self._serializeRaw(obj._values, {section: 'update.values'}));
    } else {
      // Iterate over update values
      const values = obj._values;
      const iinf = {
        section: 'update.values',
        index: 0
      };
      Object.getOwnPropertyNames(values).forEach(
          function(key, idx) {
            iinf.index = idx;
            const s = self._serializeUpdateValue(key, values[key], iinf);
            if (s)
              sb.append((idx ? ', ' : '') + s, {spacing: !idx});
          }
      );
    }

    // Serialize conditions
    sb.indent = 2;
    let s;
    if ((s = this._serializeWhere(obj._where, {section: 'update.where'}))) {
      sb.indent = 0;
      sb.append(s, {newLine: self.prettyPrint});
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
    sb.append('delete from');
    sb.append(self._serializeSqlObject(obj._table, {section: 'delete.table'}));

    // Serialize conditions
    sb.indent = 2;
    let s;
    if ((s = self._serializeWhere(obj._where, {section: 'delete.where'}))) {
      sb.indent = 0;
      sb.append(s, (sb.line.length > 40 || sb.lines > 1 || s.includes('\n')));
      if (prettyPrint) sb.cr();
    }

    return sb.toString();
  }

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
  _serializeRaw(raw, inf) {
    return raw ? raw.text || '' : '';
  }

  //noinspection JSUnusedLocalSymbols
  /**
   * Serializes array of column names comes after 'Select'
   *
   * @param {Array<Column>} columns
   * @param {Object} inf - Helper information
   * @return {string}
   * @protected
   */
  _serializeColumns(columns, inf) {
    if (!(columns && columns.length)) return '';
    const sb = new StringBuilder(this.prettyPrint ? undefined : 0);
    sb.indent += 4;
    let k = 0;
    const iinf = {section: inf.section, index: 0};
    columns.forEach((col, idx) => {
      const s = this._serializeColumn(col, iinf);
      if (s) {
        sb.append((k > 0 ? ', ' : '') + s, {spacing: false});
        k++;
      }
      iinf.index++;
    });
    return sb.toString();
  }

  /**
   * Serializes array of column names comes after 'Select'
   *
   * @param {Column} column
   * @param {Object} inf - Helper information
   * @return {string}
   * @protected
   */
  _serializeColumn(column, inf) {
    if (!column) return '';
    assert.ok(['column', 'raw', 'case', 'select'].includes(column.type),
        'Invalid object for serializing column');
    const s = this._serializeSqlObject(column, inf);
    //noinspection JSUnresolvedVariable
    return column.type === 'select' ?
        '(' + s + ')' + (column._alias ?
            ' ' + (this._isReserved(column._alias) ? '"' + column._alias +
                '"' : column._alias) : '') :
        s;
  }

  //noinspection JSMethodCanBeStatic,JSUnusedLocalSymbols
  /**
   * Serializes single field name
   *
   * @param {Column} field
   * @param {Object} inf - Helper information
   * @return {string}
   * @protected
   */
  _serializeFieldName(field, inf) {
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
   * @param {Object} inf - Helper information
   * @return {string}
   * @protected
   */
  _serializeTablesNames(tables, inf) {
    if (!(tables && tables.length)) return '';
    let str = '';
    const iinf = {section: inf.section, index: 0};
    for (const item of tables) {
      let ss;
      assert.ok(['raw', 'select', 'table'].includes(item.type),
          'Invalid object used as Table Name');
      ss = this._serializeSqlObject(item, iinf);
      if (ss) {
        if (item.type === 'select') { //noinspection JSUnresolvedVariable
          ss = '(' + ss + ')' + (item._alias ? ' ' + item._alias : '');
        }
        str += (str ? ', ' : '') + ss;
      }
      iinf.index++;
    }
    return str;
  }

  //noinspection JSMethodCanBeStatic,JSUnusedLocalSymbols
  /**
   * Serializes single table name
   *
   * @param {TableName} table
   * @param {Object} inf - Helper information
   * @return {string}
   * @protected
   */
  _serializeTableName(table, inf) {
    return (table.schema ? table.schema + '.' : '') +
        table.table +
        (table.alias ? ' ' + table.alias : '');
  }

  //noinspection JSUnusedLocalSymbols
  /**
   * Serializes single table name
   *
   * @param {ConditionGroup} group
   * @param {Object} inf - Helper information
   * @return {string}
   * @protected
   */
  _serializeWhere(group, inf) {
    const s = this._serializeConditionGroup(group, inf);
    return s ? 'where ' + s : '';
  }

  //noinspection JSUnusedLocalSymbols
  /**
   * Serializes condition group
   *
   * @param {ConditionGroup} group
   * @param {Object} inf - Helper information
   * @return {string}
   * @protected
   */
  _serializeConditionGroup(group, inf) {
    if (!group) return '';
    const self = this;
    const sb = new StringBuilder(self.prettyPrint ? undefined : 0);
    sb.indent += 4;
    let s;
    let logop = 'and';
    let k = 0;
    const iinf = {section: 'conditiongroup', index: 0};
    for (let i = 0; i < group.length; i++) {
      const item = group.item(i);
      assert.ok(['raw', 'conditiongroup', 'condition'].includes(item.type),
          'Invalid object used as Condition');

      logop = item.logicalOperator || logop;
      if ((s = self._serializeSqlObject(item, iinf))) {
        if (item.type === 'conditiongroup') s = '(' + s + ')';
        sb.append((k ? logop + ' ' : '') + s);
        k++;
      }
      iinf.index++;
    }
    return sb.toString();
  }

  //noinspection JSUnusedLocalSymbols
  /**
   * Serializes condition
   *
   * @param {Condition} item
   * @param {Object} inf - Helper information
   * @return {string}
   * @protected
   */
  _serializeCondition(item, inf) {
    let str;
    if (['raw', 'select'].includes(item.field.type)) {
      str = (str = this._serializeSqlObject(item.field, inf)) &&
      item.field.type === 'select' ?
          '(' + str + ')' : str;
    } else
      str = this._isReserved(item.field) ? '"' + item.field + '"' : item.field;

    const outParams = this.outParams;
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
        s = this._serializeValue(item.value[0], inf) + ' and ' +
            this._serializeValue(item.value[1], inf);
      }

    } else if (operator === 'like' && !prm && Array.isArray(item.value) &&
        (s = item.value.join()) && ((s.includes('%')) || s.includes('?'))) {
      s = '(';
      item.value.forEach((v, i) => {
        s += (i > 0 ? ' or ' : '') + str + ' like ' +
            this._serializeValue(String(v), inf);
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
      s = this._serializeValue(item.value, inf);
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
   * @param {Object} inf - Helper information
   * @return {string}
   * @protected
   */
  _serializeValue(val, inf) {
    if (val === null || val === undefined)
      return 'null';

    if (val instanceof RegExp) {
      const prm = val.source.toUpperCase();
      const inputParams = this._inputParams;
      let x = this.outParamsCache[prm];

      if (x === undefined) {
        if (Array.isArray(inputParams)) {
          x = this._prmIdx < inputParams.length ?
              inputParams[this._prmIdx++] :
              null;
        } else if (typeof inputParams === 'object')
          x = inputParams[prm] || null;
        this.outParamsCache[prm] = x;
      }

      if (this.namedParams) {
        this.outParams[prm] = x;
        return ':' + prm;
      } else {
        this.outParams.push(x);
        return '?';
      }
    }
    if (val.isRaw)
      return this._serializeRaw(val, inf);
    if (typeof val === 'string')
      return this._serializeStringValue(val, inf);
    if (isNumeric(val))
      return String(val);
    if (val instanceof Date)
      return this._serializeDateValue(val, inf);
    if (Array.isArray(val))
      return this._serializeArrayValue(val, inf);
    return this._serializeStringValue(String(val), inf);
  }

  //noinspection JSMethodCanBeStatic, JSUnusedLocalSymbols
  /**
   * Serializes string value
   *
   * @param {string} val
   * @param {Object} inf - Helper information
   * @return {string}
   * @protected
   */
  _serializeStringValue(val, inf) {
    return '\'' + (val || '').replace('\'', '\'\'') + '\'';
  }

  //noinspection JSMethodCanBeStatic, JSUnusedLocalSymbols
  /**
   * Serializes Date value
   *
   * @param {Date} date
   * @param {Object} inf - Helper information
   * @return {string}
   * @protected
   */
  _serializeDateValue(date, inf) {
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
   * @param {Object} inf - Helper information
   * @return {string}
   * @protected
   */
  _serializeArrayValue(arr, inf) {
    let str = '';
    for (let i = 0; i < arr.length; i++) {
      str += (str ? ',' : '') + this._serializeValue(arr[i], inf);
    }
    return str ? '(' + str + ')' : '';
  }

  //noinspection JSUnusedLocalSymbols
  /**
   * Serializes array of Joins
   *
   * @param {Array<Join>} joins
   * @param {Object} inf - Helper information
   * @return {string}
   * @protected
   */
  _serializeJoins(joins, inf) {
    if (!joins) return '';
    const self = this;
    const sb = new StringBuilder(self.prettyPrint ? undefined : 0);
    const iinf = {section: 'joins', index: 0};
    for (let i = 0; i < joins.length; i++) {
      const s = self._serializeJoin(joins[i], iinf);
      if (s)
        sb.append(s, {newLine: self.prettyPrint});
      iinf.index++;
    }
    return sb.toString();
  }

  //noinspection JSUnusedLocalSymbols
  /**
   * Serializes single Join
   *
   * @param {Join} join
   * @param {Object} inf - Helper information
   * @return {string}
   * @protected
   */
  _serializeJoin(join, inf) {
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
    if ((s = this._serializeSqlObject(join.table, inf))) {
      if (join.table.type === 'select') {
        s = '(' + s + ')' + (join.table._alias ? ' ' + join.table._alias : '');
      }
      sb.append(s);
    }

    s = this._serializeConditionGroup(join.conditions, {section: 'join.on'});
    if (s)
      sb.append('on ' + s);
    return sb.toString();
  }

  //noinspection JSUnusedLocalSymbols
  /**
   * Serializes array of 'group by' columns
   *
   * @param {Array<Column>} columns
   * @param {Object} inf - Helper information
   * @return {string}
   * @protected
   */
  _serializeGroupBy(columns, inf) {
    return this._serializeColumns(columns, {section: 'groupby'});
  }

  //noinspection JSUnusedLocalSymbols
  /**
   * Serializes array of 'order by' columns
   *
   * @param {Array<Order>} columns
   * @param {Object} inf - Helper information
   * @return {string}
   * @protected
   */
  _serializeOrderBy(columns, inf) {
    if (!(columns && columns.length)) return '';
    const sb = new StringBuilder(this.prettyPrint ? undefined : 0);
    let o;
    sb.indent = 4;
    const iinf = {section: inf.section, index: 0};
    for (let i = 0; i < columns.length; i++) {
      o = columns[i];
      let s;
      if (o.isRaw)
        s = this._serializeRaw(o, iinf);
      else s = (o.table ? o.table + '.' : '') + o.field +
          (o.descending ? ' desc' : '');

      if (s) {
        sb.append((i ? ', ' : '') + s, {spacing: false});
      }
      iinf.index++;
    }
    return sb.toString();
  }

  /**
   * Serializes single value for Update statement
   *
   * @param {string} key
   * @param {*} value
   * @param {Object} inf - Helper information
   * @return {string}
   * @protected
   */
  _serializeUpdateValue(key, value, inf) {
    let s;
    if (value instanceof RegExp) {
      const x = this._inputParams ? this._inputParams[key] : null;
      if (this.namedParams) {
        s = ':' + key;
        this.outParams[key] = x;
      } else {
        s = '?';
        this.outParams.push(x);
      }
    } else
      s = this._serializeValue(value, inf);
    return (key + ' = ' + s);
  }

  //noinspection JSUnusedLocalSymbols
  /**
   * Serializes Case expression
   *
   * @param {Case} obj
   * @param {Object} inf - Helper information
   * @return {string}
   * @protected
   */
  _serializeCase(obj, inf) {
    if (obj._expressions.length) {
      const self = this;
      const sb = new StringBuilder(this.prettyPrint ? undefined : 0);
      sb.indent = 4;
      sb.append('case');
      const iinf = {section: 'case', index: 0};

      for (const item of obj._expressions) {
        assert.ok(['conditiongroup', 'condition', 'raw'].includes(
            item.condition.type),
            'Invalid object used in "case" expression');
        const s = self._serializeSqlObject(item.condition, iinf);
        if (s)
          sb.append(
              'when ' + s + ' then ' +
              (self._serializeValue(item.value, iinf)) ||
              'null');
        iinf.index++;
      }

      iinf.index = 'else';
      if (obj._elseValue !== undefined) {
        const s = self._serializeValue(obj._elseValue, iinf);
        if (s)
          sb.append('else ' + s);
      }
      sb.append('end' + (obj._alias ? ' ' + obj._alias : ''));
      return sb.toString();
    }
  }

  //noinspection JSUnusedLocalSymbols
  /**
   * @param {SqlObject} obj
   * @param {Object} inf - Helper information
   * @return {string}
   * @protected
   */
  _serializeSqlObject(obj, inf) {
    if (obj) {
      if (['select', 'insert', 'update', 'delete'].includes(obj.type)) {
        if (this.statement) {
          const subSerializer = Serializer.create(this.config);
          subSerializer.statement = obj;
          const fn = subSerializer.objSerializers[obj.type];
          return fn ? fn.call(subSerializer, obj, inf) : '';
        } else this.statement = obj;
      }
      const fn = this.objSerializers[obj.type];
      return fn ? fn.call(this, obj, inf) : '';
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
