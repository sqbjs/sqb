import {EventEmitter} from 'events';
import {createPool, IPoolFactory, Pool} from 'lightning-pool';
import {PoolOptions, PoolState} from 'lightning-pool';
import {coerceToBoolean, coerceToInt} from 'putil-varhelpers';
import _debug from 'debug';
import {classes} from '@sqb/core';
import {
    ConnectionConfiguration,
    QueryExecuteOptions,
    TransactionFunction, QueryResult, AcquireSessionOptions
} from './types';
import {Adapter} from './Adapter';
import {Session} from './Session';

const debug = _debug('sqb:connection');

export class Connection extends EventEmitter {
    private readonly _adapter: Adapter;
    private readonly _pool: Pool<Adapter.Session>;
    private readonly _config: ConnectionConfiguration;

    constructor(config: ConnectionConfiguration) {
        super();
        if (!(config && typeof config === 'object'))
            throw new TypeError('Configuration object required');

        this._adapter = Adapter.adapters[config.driver];
        if (!this._adapter)
            throw new Error(`No connection adapter registered for "${config.driver}"`);
        const cfg = this._config = {...config};
        cfg.defaults = cfg.defaults || {};

        cfg.pool = cfg.pool || {};
        cfg.pool.acquireMaxRetries = coerceToInt(cfg.pool.acquireMaxRetries, 0);
        cfg.pool.acquireRetryWait = coerceToInt(cfg.pool.acquireRetryWait, 2000);
        cfg.pool.acquireTimeoutMillis = coerceToInt(cfg.pool.acquireTimeoutMillis, 0);
        cfg.pool.idleTimeoutMillis = coerceToInt(cfg.pool.idleTimeoutMillis, 30000);
        cfg.pool.max = coerceToInt(cfg.pool.max, 10);
        cfg.pool.maxQueue = coerceToInt(cfg.pool.maxQueue, 1000);
        cfg.pool.max = coerceToInt(cfg.pool.max, 10);
        cfg.pool.min = coerceToInt(cfg.pool.min, 0);
        cfg.pool.minIdle = coerceToInt(cfg.pool.minIdle, 0);
        cfg.pool.validation = coerceToBoolean(cfg.pool.validation, false);

        const poolFactory: IPoolFactory<Adapter.Session> = {
            create: () => this._adapter.connect(cfg),
            destroy: client => client.close(),
            reset: client => client.reset(),
            validate: client => client.ping()
        };
        const poolOptions: PoolOptions = {...config.pool};
        poolOptions.resetOnReturn = true;
        this._pool = createPool<Adapter.Session>(poolFactory, poolOptions);
        this._pool.start();
    }

    get configuration(): ConnectionConfiguration {
        return this._config;
    }

    /**
     * Return dialect
     */
    get dialect() {
        return this._adapter.dialect;
    }

    /**
     * Returns true if pool is closed
     */
    get isClosed() {
        return this._pool.state === PoolState.CLOSED;
    }

    async close(force: boolean): Promise<void> {
        return this._pool.close(force);
    }

    async execute(query: string | classes.Query,
                  options?: QueryExecuteOptions): Promise<QueryResult> {
        debug('execute');
        const client = await this._pool.acquire();
        let session;
        try {
            session = new Session(this, client);
            return await session.execute(query, options);
        } finally {
            await (session as any)._onClose();
            this._pool.release(client).catch(e => this.emitSafe('error', e));
        }
    }

    async acquire(fn: TransactionFunction, options?: AcquireSessionOptions): Promise<any> {
        debug('acquire');
        const client = await this._pool.acquire();
        let session;
        try {
            if (options?.inTransaction)
                await client.startTransaction();
            session = new Session(this, client);
            const result = await fn(session);
            if (options?.inTransaction)
                await client.commit();
            return result;
        } finally {
            try {
                if (options?.inTransaction)
                    await client.rollback();
            } catch (e) {
                this.emit('error', e);
            }
            await (session as any)._onClose();
            this._pool.release(client).catch(e => this.emitSafe('error', e));
        }
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
