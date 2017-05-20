/* SQB.js
 ------------------------
 (c) 2017-present Panates
 SQB may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/sqb/
 */

/* Internal module dependencies. */

const Serializer = require('../../serializer');

class OracleSerializer extends Serializer {

    constructor(config) {
        super(config);
        this.dialect = 'oracle';
    }

    /**
     * Serialize Select statement
     *
     * @param {Select} obj Select statement object
     * @return {String}
     * @protected
     */
    _serializeSelect(obj) {
        let sql = super._serializeSelect(obj);
        if (obj._limit || obj._offset) {
            sql =
                'select * from (select rownum row$number, t.* from (' +
                (this.prettyPrint ? '\n  ' : '') +
                sql +
                (this.prettyPrint ? '\n  ' : '') +
                ') t) ' +
                (obj._alias ? obj._alias+' ': '')+
                (this.prettyPrint ? '\n' : '') +
                'where ';
            if (obj._offset)
                sql += ' and row$number >= ' + obj._offset;
            if (obj._limit)
                sql += (obj._offset ? ' and ': ' ') + 'row$number <= ' + obj._limit;
        }
        return sql;
    }

    _serializeTablesNames(tables) {
        let s = super._serializeTablesNames(tables);
        return s || 'from dual';
    }

    _serializeCondition(item) {
        let s = super._serializeCondition(item);
        return s.replace('= null', 'is null');
    }

    _serializeDateValue(date) {
        let s = super._serializeDateValue(date);
        return s.length <= 12 ?
            'to_date(' + s + ", 'yyyy-mm-dd')" :
            'to_date(' + s + ", 'yyyy-mm-dd hh24:mi:ss')"
    }
}

module.exports = OracleSerializer;