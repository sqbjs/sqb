/* eslint-disable */
/* Internal module dependencies. */
const TestConnection = require('./test_connection');

/* External module dependencies. */
const sqb = require('../../');
const DbPool = sqb.DbPool;

/**
 * @class
 * @extends DbPool
 */
class TestPool extends DbPool {

    constructor(config) {
        super(config);
        this.serializer = sqb.serializer({
            namedParams: false,
            prettyPrint: false
        });
    }

    //noinspection JSUnusedGlobalSymbols
    /**
     *
     * @param {Function<Error, Connection>} callback
     * @protected
     * @override
     */
    _getConnection(callback) {
        callback(undefined, new TestConnection(this));
    }

}

DbPool.register('testdb', TestPool);

module.exports = TestPool;