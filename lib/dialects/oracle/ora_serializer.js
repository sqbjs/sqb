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

    constructor(config){
        super(config);
        this.dialect = 'oracle';
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