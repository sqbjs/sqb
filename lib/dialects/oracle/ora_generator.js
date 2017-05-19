/**
 * Internal module dependencies.
 */

const Generator = require('../../generator');

class OracleGenerator extends Generator {

    get dialect() {
        return 'oracle';
    }

    _generateFrom(tables) {
        let s = super._generateFrom(tables);
        return s || 'from dual';
    }

    _generateCondition(item) {
        let s = super._generateCondition(item);
        return s.replace('= null', 'is null');
    }

    _generateDateValue(date) {
        let s = super._generateDateValue(date);
        return s.length <= 12 ?
            'to_date(' + s + ", 'yyyy-mm-dd')" :
            'to_date(' + s + ", 'yyyy-mm-dd hh24:mi:ss')"
    }
}

module.exports = OracleGenerator;