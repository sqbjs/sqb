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
     * @override
     */
    _serializeSelect(obj) {
        let sql = super._serializeSelect(obj);
        const prettyPrint = this.prettyPrint,
            limit = obj._limit,
            offset = obj._offset;
        if (limit || offset) {
            sql =
                'select * from (select rownum row$number, t.* from (' +
                (prettyPrint ? '\n  ' : '') +
                sql +
                (prettyPrint ? '\n' : '') +
                ') t)' + (obj._alias ? ' ' + obj._alias : '') +
                (prettyPrint ? '\nwhere' : ' where') +
                (offset ? ' row$number >= ' + offset : '') +
                (limit ? (offset ? ' and' : '') + ' row$number <= ' + limit : '');
        }
        return sql;
    }

    /**
     * @override
     */
    _serializeTablesNames(tables) {
        return super._serializeTablesNames(tables) || 'from dual';
    }

    /**
     * @override
     */
    _serializeCondition(item) {
        let s = super._serializeCondition(item);
        if (!item.isRaw) {
            s = s.replace(/!= ?null/g, 'is not null')
                .replace(/<> ?null/g, 'is not null')
                .replace(/= ?null/g, 'is null');
        }
        return s;
    }

    /**
     * @override
     */
    _serializeDateValue(date) {
        const s = super._serializeDateValue(date);
        return s.length <= 12 ?
            'to_date(' + s + ", 'yyyy-mm-dd')" :
            'to_date(' + s + ", 'yyyy-mm-dd hh24:mi:ss')"
    }
}

module.exports = OracleSerializer;