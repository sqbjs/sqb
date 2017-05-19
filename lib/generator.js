/**
 * Internal module dependencies.
 */

const StringBuilder = require('./helpers/stringbuilder');

/**
 * External module dependencies.
 */



function isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

/**
 * @class
 * @public
 */

class Generator {

    constructor(config) {
        this._dialect = config && config.dialect;
        this.prettyPrint = config && !!config.prettyPrint;
        this.namedParams = !config || config.namedParams === undefined || !!config.namedParams;
        this.inputParams = (config && config.params) || {};
        this.reservedWords = ['select', 'with', 'join', 'and', 'or', 'not'];
    }

    get dialect() {
        return this._dialect;
    }

    build(obj) {
        this.sql = '';
        this.params = this.namedParams ? {} : [];
        if (obj.type === 'select') {
            this.sql = this._generateSelectSql(obj);
        }
        return {
            sql: this.sql,
            params: this.params
        }
    }

    _generateSelectSql(obj) {
        let sb = new StringBuilder(this.prettyPrint ? 180 : 0), s;

        sb.append('select');

        s = this._generateColumns(obj._columns);
        sb.append(s ? ' ' + s : ' *');

        if (s = this._generateFrom(obj._tables)) {
            sb.append((this.prettyPrint && sb.line.length > 40 ? '\n' : (sb.line ? ' ' : '')) + s);
        }

        if (s = this._generateJoins(obj._joins)) {
            sb.indent = 2;
            sb.append((this.prettyPrint ? (sb.line ? '\n' : '') : ' ') + s);
            if (this.prettyPrint)
                sb.cr();
        }

        if (s = this._generateWhere(obj._where)) {
            sb.indent = 0;
            sb.append((this.prettyPrint && (sb.line.length > 40 || sb.lines > 1) ? '\n' : (sb.line ? ' ' : '')) + s);
            if (this.prettyPrint) sb.cr();
        }

        if (s = this._generateOrderBy(obj._orderby)) {
            sb.indent = 0;
            sb.append((this.prettyPrint ? (sb.line ? '\n' : '') : ' ') + 'order by ' + s);
        }

        return sb.toString();
    }

    _generateRaw(raw) {
        return raw.text;
    }

    _generateColumns(columns) {
        if (!(columns && columns.length)) return;

        let sb = new StringBuilder(this.prettyPrint ? undefined : 0), col, s;
        sb.indent += 4;

        for (let i = 0; i < columns.length; i++) {
            col = columns[i];
            s = '';
            if (col.isRaw)
                s = this._generateRaw(col);

            else if (col.type === 'column')
                s = this._generateColumn(col);

            else if (col.type === 'select') {
                s = this._generateSelectSql(col);
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

    _generateColumn(column) {
        let s = (column.raw || (column.table ? column.table + '.' : '') + column.field);
        if (column.alias)
            s += ' ' + column.alias;
        return s;
    }

    _generateFrom(tables) {
        if (!(tables && tables.length)) return;
        let table, str;
        str = '';
        for (let i = 0; i < tables.length; i++) {
            table = tables[i];
            if (table.isRaw)
                str += (str ? ', ' : ' ') + this._generateRaw(table);
            else if (table.type === 'table') {
                str += (str ? ', ' : ' ') +
                    (table.schema ? table.schema + '.' : '') +
                    table.table +
                    (table.alias ? ' ' + table.alias : '')
            } else if (table.type === 'select') {
                let s = this._generateSelectSql(table);
                if (s)
                    str += ' (' + s + ')' + (table._alias ? ' ' + table._alias : '');
            } else if (table.type === 'raw') {
                let s = this._generateRaw(table);
                if (s) str += ' ' + s;
            }
        }
        return str ? 'from' + str : '';
    }

    _generateWhere(group) {
        let s = this._generateConditionGroup(group);
        if (s)
            return 'where ' + s;
        return '';
    }

    _generateConditionGroup(group) {
        if (!group) return '';
        let sb = new StringBuilder(this.prettyPrint ? undefined : 0), s;
        sb.indent += 4;
        for (let i = 0; i < group.length; i++) {
            let item = group.item(i);

            if (item.isRaw)
                s = this._generateRaw(item);

            else if (item.isConditionGroup) {
                s = this._generateConditionGroup(item);
                if (s) s = '(' + s + ')';
            } else
                s = this._generateCondition(item);

            if (s)
                sb.append((sb.line ? ' ' + item.logicalOperator + ' ' : '') + s);
        }
        return sb.toString();
    }

    _generateCondition(item) {
        let str;
        if (item.field.isSelect)
            str = '(' + this._generateSelectSql(item.field) + ') ';
        else str = this.reservedWords.indexOf(item.field) >= 0 ? '"' + item.field + '"' : item.field + ' ';

        if (item.param) {
            if (this.namedParams) {
                str += item.operator + ' :' + item.param;
                this.params[item.param] = this.inputParams[item.param];
            } else {
                str += item.operator + ' ?';
                this.params.push(this.inputParams[item.param]);
            }
        } else {
            let s = this._generateValue(item.value),
                operator = item.operator;
            if (s.startsWith('(')) {
                if (item.operator === '=')
                    operator = 'in';
                else if (item.operator === '!=')
                    operator = 'not in'
            }
            str += operator + ' ' + s;
        }
        return str;
    }

    _generateValue(val) {
        if (val === null || val === undefined)
            return 'null';
        if (val.isRaw)
            return this._generateRaw(val);
        if (typeof val === 'string')
            return this._generateStringValue(val);
        if (isNumeric(val))
            return String(val);
        if (val instanceof Date)
            return this._generateDateValue(val);
        if (Array.isArray(val))
            return this._generateArrayValue(val);
        return 'null';
    }

    _generateStringValue(val) {
        return "'" + (val || '').replace("'", "''") + "'"
    }

    _generateDateValue(date) {
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

    _generateArrayValue(arr) {
        let str = '';
        for (let i = 0; i < arr.length; i++) {
            str += (str ? ',' : '') + this._generateValue(arr[i]);
        }
        return str ? '(' + str + ')' : '';
    }

    _generateJoins(joins) {
        if (!joins) return;
        let sb = new StringBuilder(this.prettyPrint ? undefined : 0);
        for (let i = 0; i < joins.length; i++) {
            let s = this._generateJoin(joins[i]);
            if (s) {
                sb.append(s);
                if (this.prettyPrint)
                    sb.crlf();
                else sb.append(i < joins.length - 1 ? ' ' : '');
            }
        }
        return sb.toString();
    }

    _generateJoin(join) {
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
            s = this._generateSelectSql(join.table);
            if (s) {
                s = ' (' + s + ')' + (join.table._alias ? ' ' + join.table._alias : '');
                sb.append(s);
            }
        } else {
            if (join.table.isRaw)
                sb.append(' ' + this._generateRaw(join.table));
            else
                sb.append(' ' + join.table)
        }


        s = this._generateConditionGroup(join.conditions);
        if (s)
            sb.append(' on ' + s);
        return sb.toString();
    }

    _generateOrderBy(orders) {
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

module.exports = Generator;