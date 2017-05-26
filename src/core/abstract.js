/* SQB.js
 ------------------------
 (c) 2017-present Panates
 SQB may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/sqb/
 */

/* Internal module dependencies. */

const createSerializer = require('../serializer-factory');


/**
 * @class
 * @public
 */

class SqlObject {

    constructor() {
        this.type = undefined;
    }

    build(config, params) {
        return createSerializer(config).build(this, (config ? config.params : undefined) || params);
    }

}

module.exports = SqlObject;