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
        this.emit('acquire');
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
            this.emit('execute', this, request);

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
            coercion: coalesce(options.coercion, defaults.coercion),
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

}