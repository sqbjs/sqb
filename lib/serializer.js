/* SQB
 ------------------------
 (c) 2017-present Panates
 SQB may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/sqb/
 */

/* Internal module dependencies. */
const plugins = require('./plugins');

/* External module dependencies. */
const assert = require('assert');
const flattenText = require('putil-flattentext');

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
    config = typeof config === 'object' ? config : {dialect: config};
    const self = this;
    self._config = config;
    self._prmGen = 1;
    this.pluginSerializer = plugins.createSerializer(self._config);
  }

  // noinspection JSMethodCanBeStatic
  get isSerializer() {
    return true;
  }

  get dialect() {
    return this._config.dialect;
  }

  get prettyPrint() {
    return this._config.prettyPrint;
  }

  set prettyPrint(val) {
    this._config.prettyPrint = val;
  }

  get namedParams() {
    return this._config.namedParams;
  }

  set namedParams(val) {
    this._config.namedParams = val;
  }

  get strictParams() {
    return this._config.strictParams;
  }

  set strictParams(value) {
    this._config.strictParams = value;
  }

  /**
   * Serializes input object to string representation
   *
   * @param {Query} query
   * @param {Array|Object} [inputValues]
   * @return {{sql: string, params: (Object|Array) }}
   * @public
   */
  generate(query, inputValues) {
    assert.ok(['select', 'insert', 'update', 'delete'].includes(query.type),
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
  }
}

class SerializerInstance {

  constructor(owner) {
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

  // noinspection JSMethodCanBeStatic,JSUnusedGlobalSymbols
  isReserved(s) {
    s = String(s).toLowerCase();
    if (this.reservedWords.includes(s))
      return true;
    if (this.pluginSerializer &&
        typeof this.pluginSerializer.isReserved === 'function')
      return this.pluginSerializer.isReserved(s);
  }

  generate(query, inputValues) {
    this.query = query;
    this.inputValues = inputValues;
    const sql = __serialize(this, this.query);
    return flattenText(sql, {noWrap: !this.config.prettyPrint});
  }

  //noinspection JSUnusedLocalSymbols
  /**
   * Serialize Select query
   *
   * @param {SelectQuery} query Select query object
   * @return {String}
   * @protected
   */
  serializeSelect(query) {
    const self = this;
    let out = 'select';
    let sep;

    // columns part
    let s = serializeColumns(self, query._columns, {section: 'select.columns'}) ||
        '*';
    if (s.length > 60 || s.includes('\n')) {
      out += '\n\t' + s + '\b';
      sep = '\n';
    } else {
      out += ' ' + s;
      sep = ' ';
    }

    // from part
    s = serializeFrom(self, query._tables, {section: 'select.from'});
    if (s) {
      if (s.includes('\n'))
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
  }

  /**
   * Serialize Insert query
   *
   * @param {InsertQuery} query Insert query object
   * @return {string}
   * @protected
   */
  serializeInsert(query) {
    assert.ok(query && query._table &&
        ['raw', 'table'].includes(query._table.type),
        'Invalid argument. Only Raw or TableName allowed in "insert(?)"');
    assert.ok(!!query._values, 'values required for Insert query');

    const self = this;
    let out = 'insert into ' +
        __serialize(self, query._table, {section: 'insert.table'}) +
        ' (' +
        serializeColumns(self, query._columns, {section: 'insert.columns'}) +
        ')';

    // values
    const objValues = query._values;
    if (objValues) {
      if (['raw', 'select'].includes(objValues.type)) {
        const s = __serialize(self, objValues, {section: 'insert.values'});
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
        query._columns.forEach((col, idx) => {
          const field = col.field.toUpperCase();
          const val = objValues[field];
          iinf.index = idx;
          const s = serializeValue(self, val, iinf);
          if (s)
            out += (idx ? ', ' : '') + s;
        });
        out += ')';
      }
    }
    if (query._returning) {
      let s = serializeReturning(self, query._returning,
          {section: 'insert.returning'});
      if (s)
        out += '\n' + s;
    }
    return out;
  }

  /**
   * Serialize UpdateQuery query
   *
   * @param {UpdateQuery} query Update query object
   * @return {string}
   * @protected
   */
  serializeUpdate(query) {
    assert.ok(query && query._table &&
        ['raw', 'table'].includes(query._table.type),
        'Invalid argument. Only Raw or TableName allowed in "update(?)"');
    assert.ok(!!query._values, 'values required for Update query');

    const self = this;
    let out = 'update ' +
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
      Object.getOwnPropertyNames(values).forEach((key, idx) => {
            iinf.index = idx;
            const s = serializeUpdateValue(self, key, values[key], iinf);
            if (s)
              out += (idx ? ',\n' : '') + s;
          }
      );
      out += '\b';
    }

    // Serialize conditions
    const s = serializeWhere(self, query._where, {section: 'update.where'});
    if (s)
      out += '\n' + s;

    return out;
  }

  /**
   * Serialize Delete query
   *
   * @param {DeleteQuery} query Delete query object
   * @return {string}
   * @protected
   */
  serializeDelete(query) {
    assert.ok(query && query._table &&
        ['raw', 'table'].includes(query._table.type),
        'Invalid argument. Only Raw or TableName allowed in "delete(?)"');
    const self = this;
    let out = 'delete from ' +
        __serialize(self, query._table, {section: 'delete.table'});

    // Serialize conditions
    const s = serializeWhere(self, query._where, {section: 'delete.where'});
    if (s)
      out += (s.length > 60 ? '\n' : ' ') + s;

    return out;
  }

  //noinspection JSUnusedLocalSymbols,JSUnusedGlobalSymbols
  /**
   * Serializes array of column names comes after 'Select'
   *
   * @param {Array<Column>} columns
   * @param {Object} inf - Helper information
   * @return {string}
   * @protected
   */
  serializeColumns(columns, inf) {
    if (!(columns && columns.length)) return '';
    let out = '';
    let line = '';
    let k = 0;
    const self = this;
    const iinf = {section: inf.section, index: 0};
    columns.forEach((col) => {
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
  }

  // noinspection JSUnusedGlobalSymbols
  /**
   * Serializes array of column names comes after 'Select'
   *
   * @param {Column} column
   * @param {Object} inf - Helper information
   * @return {string}
   * @protected
   */
  serializeColumn(column, inf) {
    if (!column) return '';
    assert.ok(['column', 'raw', 'case', 'select'].includes(column.type),
        'Invalid object for serializing column');
    const s = __serialize(this, column, inf);
    //noinspection JSUnresolvedVariable
    return column.type === 'select' ?
        '(' + s + ')' + (column._alias ?
        ' ' + (this.isReserved(column._alias) ? '"' + column._alias +
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
  serializeFieldName(field, inf) {
    return (field.table ? field.table + '.' : '') + field.field +
        (field.alias ? ' ' +
            (this.isReserved(field.alias) ? '"' + field.alias +
                '"' : field.alias) : '');
  }

  //noinspection JSUnusedLocalSymbols,JSUnusedGlobalSymbols
  /**
   * Serializes tables names comes after 'From'
   *
   * @param {Array<SqlObject>} tables
   * @param {Object} inf - Helper information
   * @return {string}
   * @protected
   */
  serializeFrom(tables, inf) {
    if (!(tables && tables.length)) return '';
    let out = '';
    const iinf = {section: inf.section, index: 0};

    for (const item of tables) {
      assert.ok(['raw', 'select', 'table'].includes(item.type),
          'Invalid object used as Table Name');
      let s = __serialize(this, item, iinf);
      if (s) {
        const lf = s.length > 40;
        if (item.type === 'select') { //noinspection JSUnresolvedVariable
          s = '(' + (lf ? '\n\t' : '') + s + ')' + (lf ? '\b' : '') +
              (item._alias ? ' ' + item._alias : '');
        }
        out += (out ? ', ' : ' ') + s;
      }
      iinf.index++;
    }
    return out ? 'from' + out : '';
  }

  //noinspection JSUnusedLocalSymbols,JSUnusedGlobalSymbols
  /**
   * Serializes array of Joins
   *
   * @param {Array<Join>} joins
   * @param {Object} inf - Helper information
   * @return {string}
   * @protected
   */
  serializeJoins(joins, inf) {
    if (!joins || !joins.length) return '';
    const self = this;
    let out = '';
    const iinf = {section: 'joins', index: 0};
    for (let i = 0; i < joins.length; i++) {
      const s = serializeJoin(self, joins[i], iinf);
      if (s)
        out += (out ? '\n' : '') + s;
      iinf.index++;
    }
    return out;
  }

  //noinspection JSUnusedLocalSymbols,JSUnusedGlobalSymbols
  /**
   * Serializes single Join
   *
   * @param {Join} join
   * @param {Object} inf - Helper information
   * @return {string}
   * @protected
   */
  serializeJoin(join, inf) {
    let out;
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

    assert.ok(['raw', 'select', 'table'].includes(join.table.type),
        'Invalid object used as Table Name');
    let s = __serialize(this, join.table, inf);
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
  serializeRaw(raw, inf) {
    return raw ? raw.text || '' : '';
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
  serializeTableName(table, inf) {
    return (table.schema ? table.schema + '.' : '') +
        table.table +
        (table.alias ? ' ' + table.alias : '');
  }

  //noinspection JSUnusedLocalSymbols,JSUnusedGlobalSymbols
  /**
   * Serializes single table name
   *
   * @param {ConditionGroup} group
   * @param {Object} inf - Helper information
   * @return {string}
   * @protected
   */
  serializeWhere(group, inf) {
    const s = serializeConditionGroup(this, group, inf);
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
  serializeConditionGroup(group, inf) {
    if (!group || !group.length) return '';
    const self = this;
    let out = '';
    let line = '';
    let logop = 'and';
    let k = 0;
    const iinf = {section: 'conditiongroup', index: 0};
    let lf = 0;

    for (let i = 0; i < group.length; i++) {
      const item = group.item(i);
      assert.ok(['raw', 'conditiongroup', 'condition'].includes(item.type),
          'Invalid object used as Condition');

      logop = item.logicalOperator || logop;
      let s = __serialize(self, item, iinf);
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
    }
    if (line)
      out += (out ? '\n' + (lf === 1 ? '\t' : '') : '') + line;
    return out + (lf >= 1 ? '\b' : '');
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
  serializeCondition(item, inf) {
    const self = this;
    let str;
    if (['raw', 'select'].includes(item.field.type)) {
      str = (str = __serialize(self, item.field, inf)) &&
      item.field.type === 'select' ?
          '(' + str + ')' : str;
    } else
      str = self.isReserved(item.field) ? '"' + item.field + '"' : item.field;

    const outParams = self.outParams;
    let operator = item.operator.toLowerCase();
    let s;
    let prm;
    let prmValue;
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
        (s = item.value.join()) && ((s.includes('%')) || s.includes('?'))) {
      s = '(';
      item.value.forEach((v, i) => {
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
        if (['!=', '<>', ' not like'].includes(operator)) operator = 'not in';
        else operator = 'in';
      }
    }

    if (s)
      str += ' ' + operator + ' ' + s;
    return str;
  }

  //noinspection JSUnusedLocalSymbols,JSUnusedGlobalSymbols
  /**
   * Serializes any value
   *
   * @param {*} val
   * @param {Object} inf - Helper information
   * @return {string}
   * @protected
   */
  serializeValue(val, inf) {
    if (val === null || val === undefined)
      return 'null';
    const self = this;

    if (val instanceof RegExp) {
      const prm = val.source;
      const inputValues = self.inputValues;
      let x = self.outParamsCache[prm];

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
    if (typeof val === 'string')
      return serializeStringValue(self, val, inf);
    if (isNumeric(val))
      return String(val);
    if (val instanceof Date)
      return serializeDateValue(self, val, inf);
    if (Array.isArray(val))
      return serializeArrayValue(self, val, inf);
    return serializeStringValue(self, String(val), inf);
  }

  //noinspection JSMethodCanBeStatic, JSUnusedLocalSymbols,JSUnusedGlobalSymbols
  /**
   * Serializes string value
   *
   * @param {string} val
   * @param {Object} inf - Helper information
   * @return {string}
   * @protected
   */
  serializeStringValue(val, inf) {
    return '\'' + (val || '').replace('\'', '\'\'') + '\'';
  }

  //noinspection JSMethodCanBeStatic, JSUnusedLocalSymbols,JSUnusedGlobalSymbols
  /**
   * Serializes Date value
   *
   * @param {Date} date
   * @param {Object} inf - Helper information
   * @return {string}
   * @protected
   */
  serializeDateValue(date, inf) {
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

  //noinspection JSUnusedLocalSymbols,JSUnusedGlobalSymbols
  /**
   * Serializes Array value
   *
   * @param {Array} arr
   * @param {Object} inf - Helper information
   * @return {string}
   * @protected
   */
  serializeArrayValue(arr, inf) {
    let str = '';
    for (let i = 0; i < arr.length; i++) {
      str += (str ? ',' : '') + serializeValue(this, arr[i], inf);
    }
    return str ? '(' + str + ')' : '';
  }

  //noinspection JSUnusedLocalSymbols,JSUnusedGlobalSymbols
  /**
   * Serializes array of 'group by' columns
   *
   * @param {Array<Column>} columns
   * @param {Object} inf - Helper information
   * @return {string}
   * @protected
   */
  serializeGroupBy(columns, inf) {
    return serializeColumns(this, columns, {section: 'groupby'});
  }

  //noinspection JSUnusedLocalSymbols,JSUnusedGlobalSymbols
  /**
   * Serializes array of 'order by' columns
   *
   * @param {Array<Order>} columns
   * @param {Object} inf - Helper information
   * @return {string}
   * @protected
   */
  serializeOrderBy(columns, inf) {
    if (!(columns && columns.length)) return '';
    const self = this;
    let out = '';
    const iinf = {section: inf.section, index: 0};
    for (let i = 0; i < columns.length; i++) {
      const o = columns[i];
      let s;
      if (o.isRaw)
        s = serializeRaw(self, o, iinf);
      else s = (o.table ? o.table + '.' : '') + o.field +
          (o.descending ? ' desc' : '');

      if (s)
        out += (out ? ', ' : '') + s;
      iinf.index++;
    }
    return 'order by ' + out;
  }

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
  serializeUpdateValue(key, value, inf) {
    const self = this;
    let s;
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
  serializeCase(obj, inf) {
    if (obj._expressions.length) {
      const self = this;
      let out = 'case\n\t';

      const iinf = {section: 'case', index: 0};
      for (const item of obj._expressions) {
        assert.ok(['conditiongroup', 'condition', 'raw'].includes(
            item.condition.type),
            'Invalid object used in "case" expression');
        const s = __serialize(self, item.condition, iinf);
        if (s)
          out += 'when ' + s + ' then ' +
              (serializeValue(self, item.value, iinf) || 'null') + '\n';
        iinf.index++;
      }

      iinf.index = 'else';
      if (obj._elseValue !== undefined) {
        const s = serializeValue(self, obj._elseValue, iinf);
        if (s)
          out += 'else ' + s + '\n';
      }
      out += '\bend' + (obj._alias ? ' ' + obj._alias : '');
      return flattenText(out, {noWrap: out.length < 60});
    }
  }

  //noinspection JSUnusedLocalSymbols,JSUnusedGlobalSymbols
  /**
   * Serializes "returning"
   *
   * @param {Object} bindings
   * @param {Object} inf - Helper information
   * @return {string}
   * @protected
   */
  serializeReturning(bindings, inf) {
    if (!bindings) return '';
    let out = '';
    let line = '';
    let k = 0;
    Object.getOwnPropertyNames(bindings).forEach((col) => {
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
  }

  prmGen() {
    return 'generated_parameter_' + this.prmGen.generator++;
  }

}

function serializeSelect(instance, columns, inf) {
  return __serialize('serializeSelect', instance, columns, inf);
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
        ['select', 'insert', 'update', 'delete'].includes(obj.type)) {
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
