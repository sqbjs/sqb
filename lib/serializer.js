/* SQB.js
 ------------------------
 (c) 2017-present Panates
 SQB may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/sqb/
 */

/* Internal module dependencies. */

const StringBuilder = require('./helpers/stringbuilder');

/* External module dependencies. */


function isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

/**
 * @class
 * @public
 */

class Serializer {

    constructor(config) {
        config = typeof config === 'string' ? {dialect: config} : typeof config === 'object' ? config : {};
        this.dialect = config.dialect;
        this.prettyPrint = !!config.prettyPrint;
        this.namedParams = config.namedParams === undefined || !!config.namedParams;
        this.reservedWords = ['select', 'from', 'with', 'where',
            'join', 'inner', 'outer', 'full', 'and', 'or', 'not', 'between', 'null', 'like',
            'order', 'by', 'group', 'count', 'sum', 'average'];
        // We build a new map of upper keys for case insensitivity
        let values = config.params && typeof config.params === 'object' ? config.params: {},
            obj = {};
        Object.getOwnPropertyNames(values).forEach(
            function (key) {
                obj[key.toUpperCase()] = values[key];
            }
        );
        this._inputValues = obj;
    }

    /**
     * Serializes input object to string representation
     *
     * @param {SqlObject} obj
     * @return {{sql: string, params: Array|Object}}
     * @public
     */
    build(obj) {
        let sql;
        this._paramsOut = this.namedParams ? {} : [];
        if (obj.type === 'select')
            sql = this._serializeSelect(obj);
        else if (obj.type === 'insert')
            sql = this._serializeInsert(obj);
        else throw new TypeError('Invalid argument');

        return {
            sql,
            params: this._paramsOut
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
        let sb = new StringBuilder(this.prettyPrint ? 180 : 0), s;

        sb.append('select');

        s = this._serializeColumnNames(obj._columns);
        sb.append(s ? ' ' + s : ' *');

        if (s = this._serializeTablesNames(obj._tables)) {
            sb.append((this.prettyPrint && sb.line.length > 40 ? '\n' : ' ') + s);
        }

        if (s = this._serializeJoins(obj._joins)) {
            sb.indent = 2;
            sb.append((this.prettyPrint ? (sb.line ? '\n' : '') : ' ') + s);
            if (this.prettyPrint)
                sb.cr();
        }

        if (s = this._serializeWhere(obj._where)) {
            sb.indent = 0;
            sb.append((this.prettyPrint && (sb.line.length > 40 || sb.lines > 1) ? (sb.line ? '\n' : '') :
                    (sb.line ? ' ' : '')) + s);
            if (this.prettyPrint) sb.cr();
        }

        if (s = this._serializeOrderBy(obj._orderby)) {
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
        let sb = new StringBuilder(this.prettyPrint ? 180 : 0), s;

        sb.append('insert into ');

        if (obj._table.type === 'raw')
            sb.append(this._serializeRaw(obj._table));
        else if (obj._table.type === 'table')
            sb.append(this._serializeTableName(obj._table) + ' ');

        sb.append('(' + this._serializeColumnNames(obj._columns) + ') ');

        let values = obj._values || this._inputValues || {};

        if (values) {
            if (values.isRaw)
                sb.append(this._serializeRaw(values));
            else if (values.isSelect) {
                if (this.prettyPrint) sb.crlf();
                sb.append(this._serializeSelect(values));
            } else {
                sb.append('values (');
                let self = this;
                obj._columns.forEach(function (col, idx) {
                    let val = values[col.field.toUpperCase()],
                        prefix = (idx < obj._columns.length - 1 ? ', ' : '');
                    if (col.isParam) {
                        if (self.namedParams) {
                            sb.append(':' + col.field.toUpperCase() + prefix);
                            self._paramsOut[col.field.toUpperCase()] = val;
                        } else {
                            sb.append('?' + prefix);
                            self._paramsOut.push(val);
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
     * Serialize Raw object
     *
     * @param {Raw} raw
     * @return {string}
     * @protected
     */
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
        if (!(columns && columns.length)) return;

        let sb = new StringBuilder(this.prettyPrint ? undefined : 0), col, s;
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
        let s = this._serializeConditionGroup(group);
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
        let sb = new StringBuilder(this.prettyPrint ? undefined : 0), s;
        sb.indent += 4;
        for (let i = 0; i < group.length; i++) {
            let item = group.item(i);

            if (item.isRaw)
                s = this._serializeRaw(item);

            else if (item.isConditionGroup) {
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
        let str;
        if (item.field.isSelect)
            str = '(' + this._serializeSelect(item.field) + ') ';
        else str = this._isReserved(item.field) ? '"' + item.field + '" ' : item.field + ' ';

        let operator = item.operator.toLowerCase(), s;

        if (item.param) {
            let inputprm = this._inputValues[item.param.toUpperCase()];
            if (operator === 'between') {
                if (this.namedParams) {
                    s = ':' + item.param + '1 and :' + item.param + '2';
                    this._paramsOut[item.param + '1'] = Array.isArray(inputprm) ? inputprm[0] : inputprm;
                    this._paramsOut[item.param + '2'] = Array.isArray(inputprm) ? inputprm[1] : null;
                } else {
                    s = '? and ?';
                    this._paramsOut.push(Array.isArray(inputprm) ? inputprm[0] : inputprm);
                    this._paramsOut.push(Array.isArray(inputprm) ? inputprm[1] : null);
                }
            } else {
                if (this.namedParams) {
                    s = ':' + item.param;
                    this._paramsOut[item.param] = inputprm;
                } else {
                    s = '?';
                    this._paramsOut.push(inputprm);
                }
            }
        } else {
            if (operator === 'between') {
                s = this._serializeValue(item.value[0]) + ' and ' +
                    this._serializeValue(item.value[1]);
            } else
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
        if (isNumeric(val))
            return String(val);
        if (val instanceof Date)
            return this._serializeDateValue(val);
        if (Array.isArray(val))
            return this._serializeArrayValue(val);
        return this._serializeStringValue(val)
    }

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
        let d = date.getDate(),
            m = date.getMonth() + 1,
            y = date.getFullYear(),
            h = date.getHours(),
            n = date.getMinutes(),
            s = date.getSeconds(),
            str = y + '-' + (m <= 9 ? '0' + m : m) + '-' + (d <= 9 ? '0' + d : d);
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
        if (!joins) return;
        let sb = new StringBuilder(this.prettyPrint ? undefined : 0);
        for (let i = 0; i < joins.length; i++) {
            let s = this._serializeJoin(joins[i]);
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
        let sb = new StringBuilder(this.prettyPrint ? undefined : 0);
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
     * Serializes array of Order
     *
     * @param {Array<Order>} orders
     * @return {string}
     * @protected
     */
    _serializeOrderBy(orders) {
        let sb = new StringBuilder(this.prettyPrint ? undefined : 0), o;
        sb.indent = 4;
        for (let i = 0; i < orders.length; i++) {
            o = orders[i];
            if (i)
                sb.append(', ');
            sb.append((o.table ? o.table + '.' : '') + o.field + (o.descending ? ' desc' : ''));
        }
        return sb.toString();
    }

}

module.exports = Serializer;