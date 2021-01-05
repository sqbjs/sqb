import {classes} from '@sqb/builder';
import _debug from 'debug';
import {coalesce, coerceToBoolean, coerceToInt, coerceToString} from "putil-varhelpers";
import TaskQueue from 'putil-taskqueue';
import {Client} from './Client';
import {
    ConnectionOptions, ExecuteHookFunction, FetchFunction,
    FieldNaming,
    QueryExecuteOptions, QueryExecutor, QueryRequest,
    QueryResult
} from './types';
import {callFetchHooks, wrapAdapterFields, normalizeRows} from './helpers';
import {Adapter} from './Adapter';
import {Cursor} from './Cursor';
import {SafeEventEmitter} from '../SafeEventEmitter';
import {Constructor} from '../orm/orm.types';
import {Repository} from '../orm/Repository';
import {EntityDefinition} from '../orm/model/EntityDefinition';

const debug = _debug('sqb:connection');

export class Connection extends SafeEventEmitter implements QueryExecutor {

    private _intlcon?: Adapter.Connection;
    private readonly _tasks = new TaskQueue();
    private readonly _options?: ConnectionOptions;
    private readonly _closeHooks = new Set<() => Promise<void>>();
    private _inTransaction = false;
    private _refCount = 1;

    constructor(public readonly client: Client,
                adapterConnection: Adapter.Connection,
                options?: ConnectionOptions) {
        super();
        this._intlcon = adapterConnection;
        this._options = options || {};
    }

    /**
     * Returns session id
     */
    get sessionId(): string {
        return this._intlcon && this._intlcon.sessionId;
    }

    /**
     * Returns reference counter value
     */
    get refCount(): number {
        return this._refCount;
    }

    /**
     * Returns true if transaction started
     */
    get inTransaction(): boolean {
        return this._inTransaction;
    }

    /**
     * Increases internal reference counter to keep session alive
     */
    retain(): void {
        this._refCount++;
        debug('[%s] retain | refCount: %s', this.sessionId, this._refCount);
        this.emit('retain', this._refCount);
    }

    /**
     * Decreases the internal reference counter.
     * When reference count is 0, connection returns to the pool.
     * Returns true if connection released.
     */
    release(): boolean {
        if (!this._intlcon)
            return true;
        const ref = --this._refCount;
        this.emit('release', this._refCount);
        debug('[%s] release | refCount: %s', this.sessionId, ref);
        if (!ref) {
            this.close().catch(() => 0);
            return true;
        }
        return false;
    }

    /**
     * Immediately releases the connection.
     */
    async close(): Promise<void> {
        if (!this._intlcon)
            return;
        this.emit('close');
        for (const hook of this._closeHooks.values()) {
            try {
                await hook();
            } catch {
                // ignore errors
            }
        }
        const intlcon = this._intlcon;
        this._intlcon = undefined;
        this.client.pool.release(intlcon)
            .catch(e => this.client.emit('error', e));
        debug('[%s] closed', intlcon.sessionId);
    }

    async execute(query: string | classes.Query,
                  options?: QueryExecuteOptions): Promise<any> {
        if (!this._intlcon)
            throw new Error(`Can't execute query, because connection is released`);
        return this._tasks.enqueue(() => this._execute(query, options));
    }

    getRepository<T>(entity: Constructor<T> | string): Repository<T> {
        let ctor;
        if (typeof entity === 'string') {
            ctor = this.client.getEntity<T>(entity);
            if (!ctor)
                throw new Error(`Repository "${entity}" is not registered`);
        } else ctor = entity;
        const entityDef = EntityDefinition.get(ctor);
        if (!entityDef)
            throw new Error(`You must provide an @Entity annotated constructor`);
        return new Repository<T>(this, ctor);
    }

    /**
     * Executes a query
     */
    protected async _execute(query: string | classes.Query,
                             options?: QueryExecuteOptions): Promise<any> {
        if (!this._intlcon)
            throw new Error(`Can't execute query, because connection is released`);
        const intlcon = this._intlcon;
        this.retain();
        try {
            const startTime = Date.now();
            const request = this._prepareQueryRequest(query, options);
            debug('[%s] execute | %o', this.sessionId, request);
            this.emit('execute', request);

            // Call execute hooks
            if (request.executeHooks) {
                for (const fn of request.executeHooks) {
                    await fn(this, request);
                }
            }

            const response = await intlcon.execute(request);
            if (!response)
                throw new Error('Database adapter returned an empty response');

            const result: QueryResult = {
                executeTime: Date.now() - startTime
            };
            if (request.showSql)
                result.query = request;

            if (response.rows || response.cursor) {
                if (!response.fields)
                    throw new Error('Adapter did not returned fields info');
                if (!response.rowType)
                    throw new Error('Adapter did not returned rowType');
                result.fields = wrapAdapterFields(response.fields, request.fieldNaming);
                result.rowType = response.rowType;

                if (response.rows) {
                    result.rows = normalizeRows(result.fields, response.rowType, response.rows, request);
                    callFetchHooks(result.rows, request);
                } else if (response.cursor) {
                    const cursor = result.cursor = new Cursor(this, result.fields, response.cursor, request);
                    const hook = () => cursor.close();
                    cursor.once('close', () => this._closeHooks.delete(hook))
                    this._closeHooks.add(hook);
                }
            }

            if (response.rowsAffected)
                result.rowsAffected = response.rowsAffected;

            return result;
        } finally {
            this.release();
        }
    }

    async startTransaction(): Promise<void> {
        if (!this._intlcon)
            throw new Error('Can not call startTransaction() on a released connection');
        await this._intlcon.startTransaction();
        this._inTransaction = true;
        this.emit('start-transaction');
    }

    async commit(): Promise<void> {
        if (!this._intlcon)
            throw new Error('Can not call commit() on a released connection');
        await this._intlcon.commit();
        this._inTransaction = false;
        this.emit('commit');
    }

    async rollback(): Promise<void> {
        if (!this._intlcon)
            throw new Error('Can not call rollback() on a released connection');
        await this._intlcon.rollback();
        this._inTransaction = false;
        this.emit('rollback');
    }

    async test(): Promise<void> {
        if (!this._intlcon)
            throw new Error('Can not call test() on a released connection');
        await this._intlcon.test();
    }

    private _prepareQueryRequest(query: string | classes.Query,
                                 options: QueryExecuteOptions = {}): QueryRequest {
        if (!this._intlcon)
            throw new Error('Session released');
        const defaults = this.client.defaults;

        const request: QueryRequest = {
            dialect: this.client.dialect,
            sql: '',
            autoCommit: this.inTransaction ? false :
                coerceToBoolean(coalesce(options.autoCommit, this._options?.autoCommit, defaults.autoCommit), true),
            cursor: coerceToBoolean(coalesce(options.cursor, defaults.cursor), false),
            objectRows: coerceToBoolean(coalesce(options.objectRows, defaults.objectRows), true),
            ignoreNulls: coerceToBoolean(coalesce(options.ignoreNulls, defaults.ignoreNulls), false),
            fetchRows: coerceToInt(coalesce(options.fetchRows, defaults.fetchRows), 100),
            fieldNaming: coalesce(options.namingStrategy, defaults.fieldNaming) as FieldNaming,
            transform: coalesce(options.transform, defaults.transform),
            showSql: coerceToBoolean(coalesce(options.showSql, defaults.showSql), false),
            action: coerceToString(options.action)
        };
        request.ignoreNulls = request.ignoreNulls && request.objectRows;

        if (query instanceof classes.Query) {
            if (this._intlcon.onGenerateQuery)
                this._intlcon.onGenerateQuery(request, query);
            const q = query
                .generate({
                    dialect: request.dialect,
                    dialectVersion: request.dialectVersion,
                    values: options.values,
                });
            request.sql = q.sql;
            request.values = q.params;
            if (q.returningFields)
                request.returningFields = q.returningFields;
            if (query.listenerCount('execute'))
                request.executeHooks = query.listeners('execute') as ExecuteHookFunction[];
            if (query.listenerCount('fetch'))
                request.fetchHooks = query.listeners('fetch') as FetchFunction[];
        } else if (typeof query === 'string') {
            request.sql = query;
            request.values = options.values;
            request.returningFields = options.returningFields;
        }
        // @ts-ignore
        if (!request.sql)
            throw new Error('No sql given');
        return request;
    }

    emit(event: 'close'): boolean;
    emit(event: 'execute', request: QueryRequest): boolean;
    emit(event: 'error', error: Error): boolean;
    emit(event: 'retain', refCount: number): boolean;
    emit(event: 'release', refCount: number): boolean;
    emit(event: 'start-transaction'): boolean;
    emit(event: 'commit'): boolean;
    emit(event: 'rollback'): boolean;
    emit(event: string | symbol, ...args: any[]): boolean {
        return super.emit(event, ...args);
    }

    on(event: 'close', listener: () => void): this;
    on(event: 'execute', listener: (request: QueryRequest) => void): this;
    on(event: 'error', listener: (error: Error) => void): this;
    on(event: 'retain', listener: (refCount: number) => void): this;
    on(event: 'release', listener: (refCount: number) => void): this;
    on(event: 'start-transaction', listener: () => void): this;
    on(event: 'commit', listener: () => void): this;
    on(event: 'rollback', listener: () => void): this;
    on(event: string | symbol, listener: (...args: any[]) => void): this {
        return super.on(event, listener);
    }

    once(event: 'close', listener: () => void): this;
    once(event: 'execute', listener: (request: QueryRequest) => void): this;
    once(event: 'error', listener: (error: Error) => void): this;
    once(event: 'retain', listener: (refCount: number) => void): this;
    once(event: 'release', listener: (refCount: number) => void): this;
    once(event: 'start-transaction', listener: () => void): this;
    once(event: 'commit', listener: () => void): this;
    once(event: 'rollback', listener: () => void): this;
    once(event: string | symbol, listener: (...args: any[]) => void): this {
        return super.once(event, listener);
    }

    off(event: 'close', listener: () => void): this;
    off(event: 'execute', listener: (request: QueryRequest) => void): this;
    off(event: 'error', listener: (error: Error) => void): this;
    off(event: 'retain', listener: (refCount: number) => void): this;
    off(event: 'release', listener: (refCount: number) => void): this;
    off(event: 'start-transaction', listener: () => void): this;
    off(event: 'commit', listener: () => void): this;
    off(event: 'rollback', listener: () => void): this;
    off(event: string | symbol, listener: (...args: any[]) => void): this {
        return super.off(event, listener);
    }

    addListener(event: 'close', listener: () => void): this;
    addListener(event: 'execute', listener: (request: QueryRequest) => void): this;
    addListener(event: 'error', listener: (error: Error) => void): this;
    addListener(event: 'retain', listener: (refCount: number) => void): this;
    addListener(event: 'release', listener: (refCount: number) => void): this;
    addListener(event: 'start-transaction', listener: () => void): this;
    addListener(event: 'commit', listener: () => void): this;
    addListener(event: 'rollback', listener: () => void): this;
    addListener(event: string | symbol, listener: (...args: any[]) => void): this {
        return super.addListener(event, listener);
    }

    removeListener(event: 'close', listener: () => void): this;
    removeListener(event: 'execute', listener: (request: QueryRequest) => void): this;
    removeListener(event: 'error', listener: (error: Error) => void): this;
    removeListener(event: 'retain', listener: (refCount: number) => void): this;
    removeListener(event: 'release', listener: (refCount: number) => void): this;
    removeListener(event: 'start-transaction', listener: () => void): this;
    removeListener(event: 'commit', listener: () => void): this;
    removeListener(event: 'rollback', listener: () => void): this;
    removeListener(event: string | symbol, listener: (...args: any[]) => void): this {
        return super.removeListener(event, listener);
    }

    removeAllListeners(event: 'close'): this;
    removeAllListeners(event: 'execute'): this;
    removeAllListeners(event: 'error'): this;
    removeAllListeners(event: 'retain'): this;
    removeAllListeners(event: 'release'): this;
    removeAllListeners(event: 'start-transaction'): this;
    removeAllListeners(event: 'commit'): this;
    removeAllListeners(event: 'rollback'): this;
    removeAllListeners(event: string | symbol): this {
        return super.removeAllListeners(event);
    }

    listeners(event: 'close'): Function[];
    listeners(event: 'execute'): Function[];
    listeners(event: 'error'): Function[];
    listeners(event: 'retain'): Function[];
    listeners(event: 'release'): Function[];
    listeners(event: 'start-transaction'): Function[];
    listeners(event: 'commit'): Function[];
    listeners(event: 'rollback'): Function[];
    listeners(event: string | symbol): Function[] {
        return super.listeners(event);
    }

    rawListeners(event: 'close'): Function[];
    rawListeners(event: 'execute'): Function[];
    rawListeners(event: 'error'): Function[];
    rawListeners(event: 'retain'): Function[];
    rawListeners(event: 'release'): Function[];
    rawListeners(event: 'start-transaction'): Function[];
    rawListeners(event: 'commit'): Function[];
    rawListeners(event: 'rollback'): Function[];
    rawListeners(event: string | symbol): Function[] {
        return super.rawListeners(event);
    }

    listenerCount(event: 'close'): number;
    listenerCount(event: 'execute'): number;
    listenerCount(event: 'error'): number;
    listenerCount(event: 'retain'): number;
    listenerCount(event: 'release'): number;
    listenerCount(event: 'start-transaction'): number;
    listenerCount(event: 'commit'): number;
    listenerCount(event: 'rollback'): number;
    listenerCount(event: string | symbol): number {
        return super.listenerCount(event);
    }

    prependListener(event: 'close', listener: () => void): this;
    prependListener(event: 'execute', listener: (request: QueryRequest) => void): this;
    prependListener(event: 'error', listener: (error: Error) => void): this;
    prependListener(event: 'retain', listener: (refCount: number) => void): this;
    prependListener(event: 'release', listener: (refCount: number) => void): this;
    prependListener(event: 'start-transaction', listener: () => void): this;
    prependListener(event: 'commit', listener: () => void): this;
    prependListener(event: 'rollback', listener: () => void): this;
    prependListener(event: string | symbol, listener: (...args: any[]) => void): this {
        return super.prependListener(event, listener);
    }

    prependOnceListener(event: 'close', listener: () => void): this;
    prependOnceListener(event: 'execute', listener: (request: QueryRequest) => void): this;
    prependOnceListener(event: 'error', listener: (error: Error) => void): this;
    prependOnceListener(event: 'retain', listener: (refCount: number) => void): this;
    prependOnceListener(event: 'release', listener: (refCount: number) => void): this;
    prependOnceListener(event: 'start-transaction', listener: () => void): this;
    prependOnceListener(event: 'commit', listener: () => void): this;
    prependOnceListener(event: 'rollback', listener: () => void): this;
    prependOnceListener(event: string | symbol, listener: (...args: any[]) => void): this {
        return super.prependOnceListener(event, listener);
    }

}
