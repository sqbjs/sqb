import {createPool, Pool as LightningPool, PoolConfiguration, PoolFactory, PoolState} from 'lightning-pool';
import {coerceToBoolean, coerceToInt} from 'putil-varhelpers';
import _debug from 'debug';
import {classes} from '@sqb/builder';
import {
    ClientConfiguration,
    QueryExecuteOptions,
    TransactionFunction,
    QueryResult,
    ClientDefaults,
    ConnectionOptions,
    QueryExecutor,
    QueryRequest,
} from './types';
import {Adapter} from './Adapter';
import {Connection} from './Connection';
import {adapters} from './extensions';
import {SafeEventEmitter} from '../SafeEventEmitter';
import {Constructor} from '../orm/types';
import {Repository} from '../orm/Repository';
import {EntityDefinition} from '../orm/definition/EntityDefinition';

const debug = _debug('sqb:client');
const inspect = Symbol.for('nodejs.util.inspect.custom');

export class Client extends SafeEventEmitter implements QueryExecutor {
    private readonly _adapter: Adapter;
    private readonly _pool: LightningPool<Adapter.Connection>;
    private readonly _defaults: ClientDefaults;
    private readonly _entities: Record<string, Constructor> = {};

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
        this._pool.on('closing', () => this.emit('closing'));
        this._pool.on('close', () => this.emit('close'));
        this._pool.on('terminate', () => this.emit('terminate'));
        // @ts-ignore
        this._pool.on('error', (...args: any[]) => this.emit('error', ...args));
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
        this.emit('acquire', connection);
        connection.on('execute', (request: QueryRequest) =>
            this.emit('execute', request, connection));
        connection.on('error', (error: Error) =>
            this.emit('error', error, connection));
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

    getRepository<T>(entity: Constructor<T> | string): Repository<T> {
        let ctor;
        if (typeof entity === 'string') {
            ctor = this._entities[entity];
            if (!ctor)
                throw new Error(`Repository "${entity}" is not registered`);
        } else ctor = entity;
        const entityDef = EntityDefinition.get(ctor);
        if (!entityDef)
            throw new Error(`You must provide an @Entity annotated constructor`);
        return new Repository<T>(this, ctor);
    }

    toString() {
        return '[object ' + Object.getPrototypeOf(this).constructor.name + '(' +
            this.dialect + ')]';
    }

    [inspect]() {
        return this.toString();
    }

    addListener(event: 'execute', listener: (request: QueryRequest, connection: Connection) => void): this;
    addListener(event: 'error', listener: (error: Error, connection: Connection) => void): this;
    addListener(event: 'error', listener: (error: Error) => void): this;
    addListener(event: 'closing', listener: () => void): this;
    addListener(event: 'close', listener: () => void): this;
    addListener(event: 'acquire', listener: (connection: Connection) => void): this;
    addListener(event: 'terminate', listener: () => void): this;
    addListener(event: string | symbol, listener: (...args: any[]) => void): this {
        return super.addListener(event, listener);
    }

    removeListener(event: 'execute', listener: (request: QueryRequest, connection: Connection) => void): this;
    removeListener(event: 'error', listener: (error: Error, connection: Connection) => void): this;
    removeListener(event: 'error', listener: (error: Error) => void): this;
    removeListener(event: 'closing', listener: () => void): this;
    removeListener(event: 'close', listener: () => void): this;
    removeListener(event: 'acquire', listener: (connection: Connection) => void): this;
    removeListener(event: 'terminate', listener: () => void): this;
    removeListener(event: string | symbol, listener: (...args: any[]) => void): this {
        return super.removeListener(event, listener);
    }

    emit(event: 'execute', request: QueryRequest, connection: Connection): boolean;
    emit(event: 'error', error: Error, connection: Connection): boolean;
    emit(event: 'error', error: Error): boolean;
    emit(event: 'closing'): boolean;
    emit(event: 'close'): boolean;
    emit(event: 'acquire', connection: Connection): boolean;
    emit(event: 'terminate'): boolean;
    emit(event: string | symbol, ...args: any[]): boolean {
        return super.emit(event, ...args);
    }

    on(event: 'execute', listener: (request: QueryRequest, connection: Connection) => void): this;
    on(event: 'error', listener: (error: Error, connection: Connection) => void): this;
    on(event: 'error', listener: (error: Error) => void): this;
    on(event: 'closing', listener: () => void): this;
    on(event: 'close', listener: () => void): this;
    on(event: 'acquire', listener: (connection: Connection) => void): this;
    on(event: 'terminate', listener: () => void): this;
    on(event: string | symbol, listener: (...args: any[]) => void): this {
        return super.on(event, listener);
    }

    once(event: 'execute', listener: (request: QueryRequest, connection: Connection) => void): this;
    once(event: 'error', listener: (error: Error, connection: Connection) => void): this;
    once(event: 'error', listener: (error: Error) => void): this;
    once(event: 'closing', listener: () => void): this;
    once(event: 'close', listener: () => void): this;
    once(event: 'acquire', listener: (connection: Connection) => void): this;
    once(event: 'terminate', listener: () => void): this;
    once(event: string | symbol, listener: (...args: any[]) => void): this {
        return super.once(event, listener);
    }

    off(event: 'execute', listener: (request: QueryRequest, connection: Connection) => void): this;
    off(event: 'error', listener: (error: Error, connection: Connection) => void): this;
    off(event: 'error', listener: (error: Error) => void): this;
    off(event: 'closing', listener: () => void): this;
    off(event: 'close', listener: () => void): this;
    off(event: 'acquire', listener: (connection: Connection) => void): this;
    off(event: 'terminate', listener: () => void): this;
    off(event: string | symbol, listener: (...args: any[]) => void): this {
        return super.off(event, listener);
    }

    removeAllListeners(event: 'execute'): this;
    removeAllListeners(event: 'error'): this;
    removeAllListeners(event: 'error'): this;
    removeAllListeners(event: 'closing'): this;
    removeAllListeners(event: 'close'): this;
    removeAllListeners(event: 'acquire'): this;
    removeAllListeners(event: 'terminate'): this;
    removeAllListeners(event: string | symbol): this {
        return super.removeAllListeners(event);
    }

    listeners(event: 'execute'): Function[];
    listeners(event: 'error'): Function[];
    listeners(event: 'error'): Function[];
    listeners(event: 'closing'): Function[];
    listeners(event: 'close'): Function[];
    listeners(event: 'acquire'): Function[];
    listeners(event: 'terminate'): Function[];
    listeners(event: string | symbol): Function[] {
        return super.listeners(event);
    }

    rawListeners(event: 'execute'): Function[];
    rawListeners(event: 'error'): Function[];
    rawListeners(event: 'error'): Function[];
    rawListeners(event: 'closing'): Function[];
    rawListeners(event: 'close'): Function[];
    rawListeners(event: 'acquire'): Function[];
    rawListeners(event: 'terminate'): Function[];
    rawListeners(event: string | symbol): Function[] {
        return super.rawListeners(event);
    }

    listenerCount(event: 'execute'): number;
    listenerCount(event: 'error'): number;
    listenerCount(event: 'error'): number;
    listenerCount(event: 'closing'): number;
    listenerCount(event: 'close'): number;
    listenerCount(event: 'acquire'): number;
    listenerCount(event: 'terminate'): number;
    listenerCount(event: string | symbol): number {
        return super.listenerCount(event);
    }

    prependListener(event: 'execute', listener: (request: QueryRequest, connection: Connection) => void): this;
    prependListener(event: 'error', listener: (error: Error, connection: Connection) => void): this;
    prependListener(event: 'error', listener: (error: Error) => void): this;
    prependListener(event: 'closing', listener: () => void): this;
    prependListener(event: 'close', listener: () => void): this;
    prependListener(event: 'acquire', listener: (connection: Connection) => void): this;
    prependListener(event: 'terminate', listener: () => void): this;
    prependListener(event: string | symbol, listener: (...args: any[]) => void): this {
        return super.prependListener(event, listener);
    }

    prependOnceListener(event: 'execute', listener: (request: QueryRequest, connection: Connection) => void): this;
    prependOnceListener(event: 'error', listener: (error: Error, connection: Connection) => void): this;
    prependOnceListener(event: 'error', listener: (error: Error) => void): this;
    prependOnceListener(event: 'closing', listener: () => void): this;
    prependOnceListener(event: 'close', listener: () => void): this;
    prependOnceListener(event: 'acquire', listener: (connection: Connection) => void): this;
    prependOnceListener(event: 'terminate', listener: () => void): this;
    prependOnceListener(event: string | symbol, listener: (...args: any[]) => void): this {
        return super.prependOnceListener(event, listener);
    }

}
