
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

    get text() {
        return this._text;
    }

    set text(str) {
        this._text = str || '';
    }

    get isRaw() {
        return true;
    }

}

module.exports = Raw;