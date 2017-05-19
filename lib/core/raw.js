
/**
 * Internal module dependencies.
 */

const SqlObject = require('./abstract');

/**
 * @class
 * @public
 */

class Raw extends SqlObject {

    constructor(str) {
        super();
        this.type = 'raw';
        this.text = str;
    }

    get isRaw() {
        return true;
    }

}

module.exports = Raw;