/**
 * Internal module dependencies.
 */

const SqlObject = require('./abstract');

/**
 * @class
 * @public
 */

class Column extends SqlObject {

    constructor(fieldName) {
        super();
        this.type = 'column';
        let m = fieldName.match(/^(?:(\w+)(?:\.))?(\w+) ?(?:as)? ?(\w+)?$/);
        if (m) {
            this.table = m[1];
            this.field = m[2];
            this.alias = m[3];
        } else
            this.field = fieldName;
    }

    get isColumn() {
        return true;
    }

}

module.exports = Column;