/* eslint-disable */

const {Connection} = require('../../');

/**
 * @class
 * @public
 */

class TestConnection extends Connection {

    constructor(dbpool) {
        super(dbpool);
    }

    /**
     * @override
     * @return {boolean}
     */
    get closed() {
        return this._closed;
    }

    //noinspection JSUnusedGlobalSymbols
    /**
     * @override
     */
    _close() {
        super._close();
        this._closed = true;
    }

    //noinspection JSUnusedGlobalSymbols
    /**
     *
     * @param sql
     * @param params
     * @param options
     * @param callback
     * @private
     */
    _execute(sql, params, options, callback) {

        //noinspection JSUnresolvedFunction
        super._execute.apply(this, arguments);

        const out = {};
        if (sql === 'error') {
            out.error = 'Error';
            out.sql = sql;
            out.params = params;
            out.options = options;
            callback(out);
        } else {
            out.rows = [[1, 'a'], [2, 'b']];
            out.metaData = [{name: 'ID'}, {name: 'NAME'}];
            if (options.debug) {
                out.sql = sql;
                out.params = params;
                out.options = options;
            }
            callback(undefined, out);
        }
    }

    //noinspection JSUnusedGlobalSymbols
    commit(callback) {
        callback();
    }

    //noinspection JSUnusedGlobalSymbols
    rollback(callback) {
        callback();
    }


}

module.exports = TestConnection;