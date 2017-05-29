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
        this.reservedWords = ['select', 'from', 'with', 'where',
            'join', 'inner', 'outer', 'full', 'and', 'or', 'not', 'between', 'null', 'like',
            'order', 'by', 'group', 'count', 'sum', 'average'];
    }

    /**
     * Serializes input object to string representation
     *
     * @param {Statement} obj
     * @param {Array|Object} [values]
     * @return {{sql: string, params: Array|Object}}
     * @public
     */
    build(obj, values) {
        let sql;
        this._outParams = this.namedParams ? {} : [];
        if (values) {
            if (Array.isArray(values))
                this._executeParams = values;
            else if (typeof values === 'object') {
                // We build a new map with upper keys for case insensitivity
                const obj = {};
                Object.getOwnPropertyNames(values).forEach(
                    function (key) {
                        obj[key.toUpperCase()] = values[key];
                    }
                );
                this._executeParams = obj;
            }
            else
                throw new TypeError('Invalid argument');
        }

        if (obj.type === 'select') { //noinspection JSCheckFunctionSignatures
            sql = this._serializeSelect(obj);
        } else if (obj.type === 'insert') { //noinspection JSCheckFunctionSignatures
            sql = this._serializeInsert(obj);
        } else if (obj.type === 'update') { //noinspection JSCheckFunctionSignatures
            sql = this._serializeUpdate(obj);
        } else if (obj.type === 'delete') { //noinspection JSCheckFunctionSignatures
            sql = this._serializeDelete(obj);
        } else throw new TypeError('Invalid argument');

        return {
            sql,
            params: this._outParams
        }
    }

    /**
     * Checks if word is reserved
     *
     * @param {string} word
     * @return {boolean}
     * @protected
     */
    _isReserved(word) {
        return word && this.reservedWords.indexOf(String(word).toLowerCase()) >= 0;
    }

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

        s = this._serializeColumnNames(obj._columns);
        sb.append(s ? ' ' + s : ' *');

        if ((s = this._serializeTablesNames(obj._tables))) {
            sb.append((this.prettyPrint && sb.line.length > 40 ? '\n' : ' ') + s);
        }

        if ((s = this._serializeJoins(obj._joins))) {
            sb.indent = 2;
            sb.append((this.prettyPrint ? (sb.line ? '\n' : '') : ' ') + s);
            if (this.prettyPrint)
                sb.cr();
        }

        if ((s = this._serializeWhere(obj._where))) {
            sb.indent = 0;
            sb.append((this.prettyPrint && (sb.line.length > 40 || sb.lines > 1 || s.indexOf('\n') > 0) ?
                    (sb.line ? '\n' : '') : (sb.line ? ' ' : '')) + s);
            if (this.prettyPrint) sb.cr();
        }

        if ((s = this._serializeGroupBy(obj._groupby))) {
            sb.indent = 0;
            sb.append((this.prettyPrint ? (sb.line ? '\n' : '') : ' ') + 'group by ' + s);
        }

        if ((s = this._serializeOrderBy(obj._orderby))) {
            sb.indent = 0;
            sb.append((this.prettyPrint ? (sb.line ? '\n' : '') : ' ') + 'order by ' + s);
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
        const sb = new StringBuilder(this.prettyPrint ? 180 : 0);

        sb.append('insert into ');

        if (obj._table.type === 'raw')
            sb.append(this._serializeRaw(obj._table) + ' ');
        else if (obj._table.type === 'table')
            sb.append(this._serializeTableName(obj._table) + ' ');

        sb.append('(' + this._serializeColumnNames(obj._columns) + ') ');

        const objValues = obj._values || {};

        if (objValues) {
            if (objValues.isRaw)
                sb.append(this._serializeRaw(objValues));

            else if (objValues.isSelect) {
                if (this.prettyPrint) sb.crlf();
                sb.append(this._serializeSelect(objValues));

            } else {
                sb.append('values (');
                const self = this,
                    executeParams = this._executeParams;
                let prmidx = 0;

                // Iterate over columns
                obj._columns.forEach(function (col, idx) {

                    const field = col.field.toUpperCase(),
                        val = objValues[field],
                        prefix = (idx < obj._columns.length - 1 ? ', ' : '');

                    // If value in statement is RegExp, we serialize it as an out parameter
                    if (val instanceof RegExp) {
                        const prm = val.source.toUpperCase();
                        let x;

                        if (Array.isArray(executeParams))
                            x = prmidx < executeParams.length ? executeParams[prmidx++] : null;
                        else if (typeof executeParams === 'object')
                            x = executeParams[prm] || null;

                        if (self.namedParams) {
                            sb.append(':' + prm + prefix);
                            self._outParams[prm] = x;
                        } else {
                            sb.append('?' + prefix);
                            self._outParams.push(x);
                        }

                    } else {
                        sb.append(self._serializeValue(val) + prefix)
                    }
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
        assert.ok(!!obj._values, 'values required for Update statement');

        const self = this,
            prettyPrint = self.prettyPrint,
            sb = new StringBuilder(prettyPrint ? 180 : 0);

        sb.indent = 4;

        sb.append('update ');

        if (obj._table.type === 'raw')
            sb.append(self._serializeRaw(obj._table) + ' ');
        else if (obj._table.type === 'table')
            sb.append(self._serializeTableName(obj._table) + ' ');

        sb.append('set');
        if (prettyPrint)
            sb.cr();

        // Serialize update values
        if (obj._values.isRaw) {
            sb.append(' ' + self._serializeRaw(obj._values));
        } else {
            // Iterate over update values
            const values = obj._values;
            Object.getOwnPropertyNames(values).forEach(
                function (key, idx) {
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
            sb.append((prettyPrint && (sb.line.length > 40 || sb.lines > 1) ? (sb.line ? '\n' : '') :
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
        const self = this,
            prettyPrint = self.prettyPrint,
            sb = new StringBuilder(prettyPrint ? 180 : 0);

        sb.indent = 4;

        sb.append('delete from ');

        if (obj._table.type === 'raw')
            sb.append(self._serializeRaw(obj._table));
        else if (obj._table.type === 'table')
            sb.append(self._serializeTableName(obj._table));

        // Serialize conditions
        sb.indent = 2;
        let s;
        if ((s = this._serializeWhere(obj._where))) {
            sb.indent = 0;
            sb.append((prettyPrint && (sb.line.length > 40 || sb.lines > 1) ? (sb.line ? '\n' : '') :
                    (sb.line ? ' ' : '')) + s);
            if (prettyPrint) sb.cr();
        }

        return sb.toString();
    }

    //noinspection JSMethodCanBeStatic
    /**
     * Serialize Raw object
     *
     * @param {Raw} raw
     * @return {string}
     * @protected
     */
    // eslint-disable-next-line
    _serializeRaw(raw) {
        return raw.text;
    }

    /**
     * Serializes array of column names comes after 'Select'
     *
     * @param {Array<Column>} columns
     * @return {string}
     * @protected
     */
    _serializeColumnNames(columns) {
        if (!(columns && columns.length)) return '';

        const sb = new StringBuilder(this.prettyPrint ? undefined : 0);
        let col, s;
        sb.indent += 4;

        for (let i = 0; i < columns.length; i++) {
            col = columns[i];
            s = '';
            if (col.isRaw)
                s = this._serializeRaw(col);

            else if (col.type === 'column')
                s = this._serializeColumName(col);

            else if (col.type === 'select') {
                s = this._serializeSelect(col);
                if (s)
                    s = '(' + s + ')' + (col._alias ? ' ' + col._alias : '');
            }
            if (s) {
                if (sb.line) sb.append(', ', true);
                sb.append(s);
            }
        }
        return sb.toString();
    }

    //noinspection JSMethodCanBeStatic
    /**
     * Serializes single column name
     *
     * @param column
     * @return {string}
     * @protected
     */
    _serializeColumName(column) {
        return (column.table ? column.table + '.' : '') + column.field + (column.alias ? ' ' + column.alias : '');
    }

    /**
     * Serializes tables names comes after 'From'
     *
     * @param {Array<TableName>} tables
     * @return {string}
     * @protected
     */
    _serializeTablesNames(tables) {
        if (!(tables && tables.length)) return '';
        let table, str;
        str = '';
        for (let i = 0; i < tables.length; i++) {
            table = tables[i];
            let ss;
            if (table.type === 'raw')
                ss = this._serializeRaw(table);
            else if (table.type === 'table')
                ss = this._serializeTableName(table);
            else if (table.type === 'select') {
                ss = (ss = this._serializeSelect(table)) ?
                    '(' + ss + ')' + (table._alias ? ' ' + table._alias : '') : '';
            }
            if (ss)
                str += (str ? ', ' : ' ') + ss;
        }
        return str ? 'from' + str : '';
    }

    //noinspection JSMethodCanBeStatic
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
            (table.alias ? ' ' + table.alias : '')
    }

    _serializeWhere(group) {
        const s = this._serializeConditionGroup(group);
        if (s)
            return 'where ' + s;
        return '';
    }

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
        sb.indent += 4;
        for (let i = 0; i < group.length; i++) {
            const item = group.item(i);

            if (item.isRaw)
                s = this._serializeRaw(item);

            else if (item.type === 'conditiongroup') {
                s = this._serializeConditionGroup(item);
                if (s) s = '(' + s + ')';
            } else
                s = this._serializeCondition(item);

            if (s)
                sb.append((sb.line ? ' ' + item.logicalOperator + ' ' : '') + s);
        }
        return sb.toString();
    }

    /**
     * Serializes condition
     *
     * @param {Condition} item
     * @return {string}
     * @protected
     */
    _serializeCondition(item) {

        if (item.field.isRaw)
            return this._serializeRaw(item.field);

        let str;
        if (item.field.isSelect)
            str = '(' + this._serializeSelect(item.field) + ') ';
        else str = this._isReserved(item.field) ? '"' + item.field + '" ' : item.field + ' ';

        const outParams = this._outParams;
        let operator = item.operator.toLowerCase(),
            s;

        if (item.param) {
            const prm = item.param.toUpperCase(),
                inputprm = this._executeParams ? this._executeParams[prm] : null,
                inputIsArray = Array.isArray(inputprm);
            if (operator === 'between') {
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
                if (this.namedParams) {
                    s = ':' + prm;
                    outParams[prm] = inputprm;
                } else {
                    s = '?';
                    outParams.push(inputprm);
                }
            }
        } else {
            if (operator === 'between') {
                s = this._serializeValue(item.value[0]) + ' and ' +
                    this._serializeValue(item.value[1]);
            } else if (operator === 'like')
                s = this._serializeValue(String(item.value));
            else
                s = this._serializeValue(item.value);
            if (s.startsWith('(')) {
                if (operator === '=') operator = 'in';
                else if (operator === '!=') operator = 'not in'
            }
        }

        if (s)
            str += operator + ' ' + s;
        return str;
    }

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
        return this._serializeStringValue(String(val))
    }

    //noinspection JSMethodCanBeStatic
    /**
     * Serializes string value
     *
     * @param {string} val
     * @return {string}
     * @protected
     */
    _serializeStringValue(val) {
        return "'" + (val || '').replace("'", "''") + "'"
    }

    /**
     * Serializes Date value
     *
     * @param {Date} date
     * @return {string}
     * @protected
     */
    _serializeDateValue(date) {
        const d = date.getDate(),
            m = date.getMonth() + 1,
            y = date.getFullYear(),
            h = date.getHours(),
            n = date.getMinutes(),
            s = date.getSeconds();
        let str = y + '-' + (m <= 9 ? '0' + m : m) + '-' + (d <= 9 ? '0' + d : d);
        if (h || n || s)
            str += ' ' + (h <= 9 ? '0' + h : h) + ':' +
                (n <= 9 ? '0' + n : n) + ':' +
                (s <= 9 ? '0' + s : s);
        return "'" + str + "'";
    }

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

        if (join.table.type === 'select') {
            s = this._serializeSelect(join.table);
            if (s) {
                s = ' (' + s + ')' + (join.table._alias ? ' ' + join.table._alias : '');
                sb.append(s);
            }
        } else {
            if (join.table.isRaw)
                sb.append(' ' + this._serializeRaw(join.table));
            else
                sb.append(' ' + join.table)
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
        return this._serializeColumnNames(columns);
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
            else s = (o.table ? o.table + '.' : '') + o.field + (o.descending ? ' desc' : '');

            if (s) {
                if (i) sb.append(', ');
                sb.append(s);
            }
        }
        return sb.toString();
    }

    /**
     * Serializes single value Update statement
     *
     * @param {string} key
     * @param {*} value
     * @return {string}
     * @protected
     */
    _serializeUpdateValue(key, value) {
        let s;
        if (value instanceof RegExp) {
            const x = this._executeParams ? this._executeParams[key] : null;
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
}

Serializer.register = function (dialect, serializerProto) {
    const items = this._registry = this._registry || {};
    items[dialect] = serializerProto;
};

Serializer.get = function (dialect) {
    return this._registry ? this._registry[dialect] : undefined;
};

Serializer.create = function (config) {
    if (config instanceof Serializer)
        return config;

    config = typeof config === 'string' ? {dialect: config} : typeof config === 'object' ? config : {};

    if (!config.dialect || config.dialect === 'generic')
        return new Serializer(config);

    const clazz = this.get(config.dialect);
    if (clazz)
        return new clazz(config);
    else throw new Error(`Dialect "${config.dialect}" is not registered`);
};

module.exports = Serializer;