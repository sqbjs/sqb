/**
 * Internal module dependencies.
 */

const createGenerator = require('../generator-factory');

/**
 * External module dependencies.
 */


/**
 * @class
 * @public
 */

class SqlObject {

    constructor() {
    }

    build(config) {
        return createGenerator(config).build(this);
    }

}

module.exports = SqlObject;