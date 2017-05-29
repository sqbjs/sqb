/* SQB-connect
 ------------------------
 (c) 2017-present Panates
 SQB may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/sqb/
 */

/* External module dependencies. */
const {EventEmitter} = require('events');
const debug = require('debug')('sqb:Connection');

/**
 * @class
 * @public
 */

class Connection extends EventEmitter {

    constructor(dbpool) {
        super();
        Object.defineProperty(this, 'dbpool', {value: dbpool, writable: false, configurable: false});
        this._refcount = 0;
        if (process.env.DEBUG)
            debug('Created (' + this.sessionId + ')');
    }

    //noinspection JSUnusedGlobalSymbols
    get closed() {
        return true;
    }

    get sessionId() {
    }

    //noinspection JSUnusedGlobalSymbols
    /**
     * @protected
     */
    acquire() {
        this._refcount++;
        if (process.env.DEBUG)
            debug('(%s) acquire refcount = %s', this.sessionId, this._refcount);
        //noinspection JSUnresolvedFunction
        this.emit('acquire');
    }

    /**
     * @protected
     */
    release() {
        this._refcount--;
        if (process.env.DEBUG)
            debug('(%s) release refcount = %s', this.sessionId, this._refcount);
        //noinspection JSUnresolvedFunction
        this.emit('release');
        if (!this._refcount)
            this.close();
    }

    close() {
        if (!this._refcount)
            this._close();
    }

    commit() {

    }

    rollback() {

    }

    select(...args) {
        const statement = this.dbpool.select(...args);
        statement.connection = this;
        return statement;
    }

    insert(...args) {
        const statement = this.dbpool.insert(...args);
        statement.connection = this;
        return statement;
    }

    update(...args) {
        const statement = this.dbpool.update(...args);
        statement.connection = this;
        return statement;
    }

    //noinspection ReservedWordAsName
    delete(...args) {
        const statement = this.dbpool.delete(...args);
        statement.connection = this;
        return statement;
    }

    execute(statement, params, options, callback) {

        if (typeof params === 'function') {
            callback = params;
            params = undefined;
            options = undefined;
        } else if (typeof options === 'function') {
            callback = options;
            options = undefined;
        }

        const self = this,
            serializer = this.dbpool.serializer;
        let sql, prms;

        if (typeof statement === 'object' && typeof statement.build === 'function') {
            if (params)
                statement.params(params);
            const o = statement.build(serializer);
            sql = o.sql;
            prms = o.params;
            options = options || statement._options;
        } else {
            sql = statement;
            prms = params;
        }

        options = options || {};
        options.autoCommit = options.autoCommit !== undefined ? options.autoCommit : false;
        options.extendedMetaData = options.extendedMetaData !== undefined ? options.extendedMetaData : false;
        options.prefetchRows = options.prefetchRows !== undefined ? options.prefetchRows : 100;
        options.maxRows = options.maxRows !== undefined ? options.maxRows : 100;
        options.resultSet = options.resultSet !== undefined ? options.resultSet : false;
        options.objectRows = options.objectRows !== undefined ? options.objectRows : false;
        options.showSql = options.showSql !== undefined ? options.showSql : false;

        this.dbpool.emit('execute', {
            sql,
            params: prms,
            options,
            identity: statement ? statement._identity : undefined
        });

        if (callback) {
            this._execute(sql, prms, options, function (err, result) {
                try {
                    callback(err, result);
                } finally {
                    self.release();
                }
            });
            return this;
        } else {
            return new Promise(function (resolve, reject) {
                self._execute(sql, prms, options, function (err, result) {
                    if (err)
                        reject(err);
                    else resolve(result);
                });
            });
        }

    }

    /* Abstract members */

    _close() {
        if (process.env.DEBUG)
            debug('(%s) close', this.sessionId);
        //noinspection JSUnresolvedFunction
        this.emit('close', this);
    }

    _execute() {
        if (process.env.DEBUG)
            debug('(%s) execute: %o', this.sessionId, Array.prototype.slice.call(arguments));
    }

}

module.exports = Connection;