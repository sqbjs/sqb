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
    }

    build(config) {
        return createSerializer(config).build(this);
    }

}

module.exports = SqlObject;