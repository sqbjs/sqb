import {classes} from '@sqb/core';
import _debug from 'debug';
import {coalesce, coerceToBoolean, coerceToInt, coerceToString} from "putil-varhelpers";
import {Connection} from './Connection';
import {
    ExecuteHookFunction,
    FetchFunction, FieldNaming,
    PreparedQuery,
    QueryExecuteOptions,
    QueryResult
} from './types';
import {callFetchHooks, normalizeFieldMap, normalizeRows} from './helpers';
import {Adapter} from './Adapter';
import {Cursor} from './Cursor';

const debug = _debug('sqb:session');

export class Session {

    private readonly _adapterSession: Adapter.Session;
    private readonly _cursors: Set<Cursor> = new Set();

    constructor(public readonly connection: Connection, adapterSession: Adapter.Session) {
        this._adapterSession = adapterSession;
    }

    get sessionId(): string {
        return this._adapterSession.sessionId;
    }

    async execute(query: string | classes.Query,
                  options?: QueryExecuteOptions): Promise<any> {
        debug('execute');
        const startTime = Date.now();
        const prepared = this._prepareQuery(query, options);
        if (process.env.DEBUG)
            debug('[%s] execute | %o', this.sessionId, prepared);
        this.connection.emitSafe('execute', this, prepared);

        await this._callExecuteHooks(prepared);

        const response = await this._adapterSession.execute(prepared);
        if (!response)
            throw new Error('Database adapter returned empty response');

        const result: QueryResult = {
            executeTime: Date.now() - startTime
        };
        if (prepared.showSql)
            result.query = prepared;

        if (Adapter.isSelectResponse(response)) {
            result.fields = normalizeFieldMap(response.fields, prepared.fieldNaming);
            if (response.rows) {
                result.rowType = response.rowType;
                result.rows = normalizeRows(result.fields, response.rowType, response.rows, prepared);
                callFetchHooks(result.rows, prepared);
            }
        } else if (Adapter.isUpdateResponse(response)) {
            result.rowsAffected = response.rowsAffected;
            if (response.returns)
                result.returns = response.returns;
        } else if (Adapter.isCursorResponse(response)) {
            result.fields = normalizeFieldMap(response.fields, prepared.fieldNaming);
            const cursor = result.cursor = new Cursor(this, result.fields, response.cursor, prepared);
            this._cursors.add(cursor);
            result.cursor.on('close', () => this._cursors.delete(cursor));
        } else
            throw new Error('Adapter returned an invalid response');

        return result;
    }

    async startTransaction(): Promise<void> {
        await this._adapterSession.startTransaction();
    }

    async commit(): Promise<void> {
        await this._adapterSession.commit();
    }

    async rollback(): Promise<void> {
        await this._adapterSession.rollback();
    }

    private _prepareQuery(query: string | classes.Query,
                          options: QueryExecuteOptions = {}): PreparedQuery {
        const prepared: PreparedQuery = {sql: ''};
        const adapter = (this.connection as any)._adapter;
        const defaults = this.connection.configuration.defaults;

        prepared.autoCommit = coerceToBoolean(coalesce(options.autoCommit, defaults?.autoCommit), false);
        prepared.createCursor = coerceToBoolean(coalesce(options.createCursor, defaults?.createCursor), false);
        prepared.objectRows = coerceToBoolean(coalesce(options.objectRows, defaults?.objectRows), true);
        prepared.ignoreNulls = coerceToBoolean(coalesce(options.ignoreNulls, defaults?.ignoreNulls), false);
        prepared.fetchRows = coerceToInt(coalesce(options.fetchRows, defaults?.fetchRows), 100);
        prepared.fieldNaming = coerceToString(coalesce(options.namingStrategy, defaults?.fieldNaming)) as FieldNaming;
        prepared.coercion = coalesce(options.coercion, defaults?.coercion);
        prepared.showSql = coerceToBoolean(coalesce(options.showSql, defaults?.showSql), false);
        prepared.action = coerceToString(options.action);

        prepared.ignoreNulls = prepared.ignoreNulls && prepared.objectRows;

        if (typeof query === 'object' && typeof (query as any).generate === 'function') {
            const q = (query as classes.Query)
                .generate({
                    dialect: adapter.dialect,
                    paramType: adapter.paramType,
                    values: options.values
                });
            prepared.sql = q.sql;
            prepared.values = q.values;
            if (query.listenerCount('execute'))
                prepared.executeHooks = query.listeners('execute') as ExecuteHookFunction[];
            if (query.listenerCount('fetch'))
                prepared.fetchHooks = query.listeners('fetch') as FetchFunction[];
        } else if (typeof query === 'string') {
            prepared.sql = query;
            prepared.values = options.values;
            // prepared.returningParams = options.returningParams;
        }
        // @ts-ignore
        if (!prepared.sql)
            throw new Error('No sql given');
        return prepared;
    }

    private async _callExecuteHooks(prepared: PreparedQuery) {
        if (!prepared.executeHooks)
            return;
        for (const fn of prepared.executeHooks) {
            await fn(this, prepared);
        }
    }

    private async _onClose(): Promise<void> {
        const cursors = Array.from(this._cursors.values());
        for (const cursor of cursors)
            try {
                await cursor.close();
            } catch (ignored) {
                //
            }
    }

}
