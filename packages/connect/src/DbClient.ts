import {EventEmitter} from 'events';
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

const debug = _debug('sqb:client');
const inspect = Symbol.for('nodejs.util.inspect.custom');

export class DbClient extends EventEmitter {
    private readonly _adapter: Adapter;
    private readonly _pool: LightningPool<Adapter.Connection>;
    private readonly _defaults: ClientDefaults;

    constructor(config: ClientConfiguration) {
        super();
        if (!(config && typeof config === 'object'))
            throw new TypeError('Configuration object required');

        const adapter = adapters.find(x => x.driver === config.driver);
        if (!adapter)
            throw new Error(`No database adapter registered for "${config.driver}"`);
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
        this._pool.start();
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
     * Obtains a connection from the connection pool.
     */
    async acquire(options?: ConnectionOptions): Promise<Connection> {
        debug('acquire');
        const adapterConnection = await this._pool.acquire();
        const opts = {autoCommit: this.defaults.autoCommit, ...options}
        const connection = new Connection(this, adapterConnection, opts);
        connection.on('execute', (...args) => this.emitSafe('execute', ...args));
        return connection;
    }

    /**
     * Shuts down the pool and destroys all resources.
     */
    async close(terminateWait?: number): Promise<void> {
        const ms = terminateWait == null ? Infinity: 0;
        return this._pool.close(ms);
    }

    /**
     * Executes a query or callback with a new acquired connection.
     */
    async execute(query: string | classes.Query | TransactionFunction,
                  options?: QueryExecuteOptions): Promise<QueryResult> {
        debug('execute');
        const connection = await this.acquire();
        try {
            if (typeof query === 'function')
                return await query(connection);
            return await connection.execute(query, options);
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

    emitSafe(event: string | symbol, ...args: any[]): boolean {
        try {
            if (event === 'error' && !this.listenerCount('error'))
                return false;
            return this.emit(event, ...args);
        } catch (ignored) {
            debug('emit-error', ignored);
            return false;
        }
    }

}
