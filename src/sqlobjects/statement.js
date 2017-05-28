/* SQB
 ------------------------
 (c) 2017-present Panates
 SQB may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/sqb/
 */

/* Internal module dependencies. */
const SqlObject = require('./abstract');
const Serializer = require('../serializer');

/* External module dependencies. */
const assert = require('assert');


/**
 * @class
 * @public
 */

class Statement extends SqlObject {

    //noinspection SpellCheckingInspection
    constructor(builder) {
        super();
        this.builder = builder;
        this.connection = undefined;
    }

    dbpool() {
        return typeof this.builder.connect === 'function' ? this.builder : undefined;
    }

    build(config, params) {
        if (config instanceof Serializer) {
            config.build(this, (config ? config.params : undefined) || params);
        } else
            return Serializer.create(config).build(this, (config ? config.params : undefined) || params);
    }

    //noinspection JSUnusedGlobalSymbols
    then(callback) {
        if (this.connection)
            return this.connection.execute(this).then(callback);
        else {
            const dbpool = this.dbpool;
            assert.ok(dbpool, 'This statement is not executable');
            return dbpool.connect(conn => conn.execute(this)).then(callback);
        }
    }

    execute(params, options, callback) {
        if (this.connection)
            return this.connection.execute(this, params, options, callback);
        else {
            const dbpool = this.dbpool;
            assert.ok(dbpool, 'This statement is not executable');
            return dbpool.connect(conn => conn.execute(this, params, options, callback));
        }
    }

}

module.exports = Statement;