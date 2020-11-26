import {createPool, Pool as LightningPool, PoolConfiguration, PoolFactory, PoolState} from 'lightning-pool';
import {coerceToBoolean, coerceToInt} from 'putil-varhelpers';
import _debug from 'debug';
import {classes} from '@sqb/builder';
import {
    ClientConfiguration,
    QueryExecuteOptions,
    TransactionFunction, QueryResult, ClientDefaults, ConnectionOptions,
} from './types';
import {Adapter} from './Adapter';
import {Connection} from './Connection';
import {adapters} from './extensions';
import {SafeEventEmitter} from './SafeEventEmitter';

const debug = _debug('sqb:client');
const inspect = Symbol.for('nodejs.util.inspect.custom');

export class Client extends SafeEventEmitter {
    private readonly _adapter: Adapter;
    private readonly _pool: LightningPool<Adapter.Connection>;
    private readonly _defaults: ClientDefaults;

    constructor(config: ClientConfiguration) {
        super();
        if (!(config && typeof config === 'object'))
            throw new TypeError('Configuration object required');

        let adapter;
        if (config.driver) {
            adapter = adapters.find(x => x.driver === config.driver);
            if (!adapter)
                throw new Error(`No database adapter registered for "${config.driver}" driver`);
        } else if (config.dialect) {
            adapter = adapters.find(x => x.dialect === config.dialect);
            if (!adapter)
                throw new Error(`No database adapter registered for "${config.dialect}" dialect`);
        }
        if (!adapter)
            throw new Error(`You must provide one of "driver" or "dialect" properties`);

        this._adapter = adapter;

        this._defaults = config.defaults || {};

        const poolOptions: PoolConfiguration = {};
        const popts = config.pool || {};
        poolOptions.acquireMaxRetries = coerceToInt(popts.acquireMaxRetries, 0);
        poolOptions.acquireRetryWait = coerceToInt(popts.acquireRetryWait, 2000);
        poolOptions.acquireTimeoutMillis = coerceToInt(popts.acquireTimeoutMillis, 0);
        poolOptions.idleTimeoutMillis = coerceToInt(popts.idleTimeoutMillis, 30000);
        poolOptions.max = coerceToInt(popts.max, 10);
        poolOptions.maxQueue = coerceToInt(popts.maxQueue, 1000);
        poolOptions.max = coerceToInt(popts.max, 10);
        poolOptions.min = coerceToInt(popts.min, 0);
        poolOptions.minIdle = coerceToInt(popts.minIdle, 0);
        poolOptions.validation = coerceToBoolean(popts.validation, false);

        const cfg = {...config};
        const poolFactory: PoolFactory<Adapter.Connection> = {
            create: () => adapter.connect(cfg),
            destroy: instance => instance.close(),
            reset: instance => instance.reset(),
            validate: instance => instance.test()
        };

        this._pool = createPool<Adapter.Connection>(poolFactory, poolOptions);
    }

    get defaults(): ClientDefaults {
        return this._defaults;
    }

    /**
     * Returns dialect
     */
    get dialect() {
        return this._adapter.dialect;
    }

    /**
     * Returns database driver name
     */
    get driver() {
        return this._adapter.driver;
    }

    /**
     * Returns true if pool is closed
     */
    get isClosed() {
        return this._pool.state === PoolState.CLOSED;
    }

    get pool(): LightningPool {
        return this._pool;
    }

    /**
     * Obtains a connection from the connection pool and executes the callback
     */
    async acquire(fn: TransactionFunction, options?: ConnectionOptions): Promise<any>;
    /**
     * Obtains a connection from the connection pool.
     */
    async acquire(options?: ConnectionOptions): Promise<Connection>
    async acquire(arg0?: any, arg1?: any): Promise<any> {
        debug('acquire');
        if (typeof arg0 === 'function') {
            const connection = await this.acquire(arg1 as ConnectionOptions);
            try {
                return await arg0(connection);
            } finally {
                connection.release();
            }
        }
        const options = arg1 as ConnectionOptions;
        const adapterConnection = await this._pool.acquire();
        const opts = {autoCommit: this.defaults.autoCommit, ...options}
        const connection = new Connection(this, adapterConnection, opts);
        connection.on('execute', (...args) => this.emit('execute', connection, ...args));
        connection.on('error', (...args) => this.emit('error', connection, ...args));
        return connection;
    }

    /**
     * Shuts down the pool and destroys all resources.
     */
    async close(terminateWait?: number): Promise<void> {
        const ms = terminateWait == null ? Infinity : 0;
        return this._pool.close(ms);
    }

    /**
     * Executes a query or callback with a new acquired connection.
     */
    async execute(query: string | classes.Query,
                  options?: QueryExecuteOptions): Promise<QueryResult> {
        debug('execute');
        const connection = await this.acquire();
        try {
            const qr = await connection.execute(query, options);
            if (qr && qr.cursor) {
                connection.retain();
                qr.cursor.once('close', () => connection.release());
            }
            return qr;
        } finally {
            connection.release();
        }
    }

    /**
     * Tests the pool
     */
    async test(): Promise<void> {
        const connection = await this.acquire();
        try {
            await connection.test();
        } finally {
            connection.release();
        }
    }

    toString() {
        return '[object ' + Object.getPrototypeOf(this).constructor.name + '(' +
            this.dialect + ')]';
    }

    [inspect]() {
        return this.toString();
    }

}