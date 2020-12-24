import {Adapter} from './Adapter';
import {Connection} from './Connection';
import {FieldInfoMap} from './FieldInfoMap';
import DoublyLinked from 'doublylinked';
import TaskQueue from 'putil-taskqueue';
import _debug from 'debug';
import {coerceToInt} from 'putil-varhelpers';
import {callFetchHooks, normalizeRows} from './helpers';
import {ObjectRow, QueryRequest} from './types';
import {CursorStream, CursorStreamOptions} from './CursorStream';
import {SafeEventEmitter} from '../SafeEventEmitter';

const debug = _debug('sqb:cursor');

export class Cursor extends SafeEventEmitter {

    private readonly _connection: Connection;
    private readonly _fields: FieldInfoMap;
    private readonly _prefetchRows: number;
    private readonly _request: QueryRequest;

    private _intlcur?: Adapter.Cursor;
    private _taskQueue = new TaskQueue();
    private _fetchCache = new DoublyLinked();
    private _rowNum = 0;
    private _fetchedAll = false;
    private _fetchedRows = 0;
    private _row: any;
    private _cache?: DoublyLinked;

    constructor(connection: Connection, fields: FieldInfoMap,
                adapterCursor: Adapter.Cursor,
                request: QueryRequest) {
        super();
        this._connection = connection;
        this._intlcur = adapterCursor;
        this._fields = fields;
        this._request = request;
        this._prefetchRows = request?.fetchRows || 100;
    }

    /**
     * Returns the Connection instance
     */
    get connection() {
        return this._connection;
    }


    /**
     * Returns if cursor is before first record.
     */
    get isBof(): boolean {
        return !this._rowNum;
    }

    /**
     * Returns if cursor is closed.
     */
    get isClosed(): boolean {
        return !this._intlcur;
    }

    /**
     * Returns if cursor is after last record.
     */
    get isEof(): boolean {
        return this._fetchedAll && this.rowNum > this._fetchedRows;
    }

    /**
     * Returns number of fetched record count from database.
     */
    get fetchedRows(): number {
        return this._fetchedRows;
    }

    /**
     * Returns object instance which contains information about fields.
     */
    get fields(): FieldInfoMap {
        return this._fields;
    }

    /**
     * Returns current row
     */
    get row(): any {
        return this._row;
    }

    /**
     * Returns current row number.
     */
    get rowNum(): number {
        return this._rowNum;
    }

    /**
     * Enables cache
     */
    cached(): void {
        if (this.fetchedRows)
            throw new Error('Cache can be enabled before fetching rows');
        if (!this._cache)
            this._cache = new DoublyLinked();
    }

    /**
     * Closes cursor
     */
    async close(): Promise<void> {
        if (!this._intlcur)
            return;
        try {
            await this._intlcur.close();
            this._intlcur = undefined;
            debug('close');
            this.emit('close');
        } catch (err) {
            debug('close-error:', err);
            this.emit('error', err);
            throw err;
        }
    }

    /**
     * If cache is enabled, this call fetches and keeps all records in the internal cache.
     * Otherwise it throws error. Once all all records fetched,
     * you can close Cursor safely and can continue to use it in memory.
     * Returns number of fetched rows
     */
    async fetchAll(): Promise<number> {
        if (!this._cache)
            throw new Error('fetchAll() method needs cache to be enabled');
        const n = this.rowNum;
        const v = await this._seek(Number.MAX_SAFE_INTEGER, true);
        await this._seek(n - this.rowNum, true);
        return v;
    }

    /**
     * Moves cursor to given row number.
     * cursor can move both forward and backward if cache enabled.
     * Otherwise it throws error.
     */
    async moveTo(rowNum: number): Promise<ObjectRow> {
        await this._seek(rowNum - this.rowNum);
        return this.row;
    }

    /**
     * Moves cursor forward by one row and returns that row.
     * And also it allows iterating over rows easily.
     */
    async next(): Promise<ObjectRow> {
        debug('next');
        await this._seek(1);
        return this.row;
    }

    /**
     *  Moves cursor back by one row and returns that row.
     *  And also it allows iterating over rows easily.
     */
    async prev(): Promise<ObjectRow> {
        await this._seek(-1);
        return this.row;
    }

    /**
     * Moves cursor before first row. (Required cache enabled)
     */
    reset() {
        if (!this._cache)
            throw new Error('reset() method needs cache to be enabled');
        this._cache.reset();
        this._rowNum = 0;
        this.emit('reset');
    }

    /**
     * Moves cursor by given step. If caching is enabled,
     * cursor can move both forward and backward. Otherwise it throws error.
     */
    async seek(step: number): Promise<ObjectRow> {
        await this._seek(step);
        return this.row;
    }

    /**
     * Creates and returns a readable stream.
     */
    toStream(options?: CursorStreamOptions): CursorStream {
        return new CursorStream(this, options);
    }

    toString() {
        return '[object ' + Object.getPrototypeOf(this).constructor.name + ']';
    }

    inspect() {
        return this.toString();
    }

    /**
     *
     */
    async _seek(step: number, silent?: boolean): Promise<number> {
        step = coerceToInt(step);
        if (!step || (step > 0 && this.isClosed))
            return this.rowNum;

        if (step < 0 && !this._cache)
            throw new Error('To move cursor back, it needs cache to be enabled');

        const _this = this;
        await this._taskQueue.enqueue(async function () {

            /* If moving backward */
            if (step < 0) {
                /* Seek cache */
                while (step < 0 && _this._cache?.cursor) {
                    _this._row = _this._cache.prev();
                    _this._rowNum--;
                    step++;
                }
                return;
            }

            while (step > 0) {
                if (_this.isEof)
                    return;
                /* Seek cache */
                while (step > 0 && _this._cache && (_this._row = _this._cache.next())) {
                    _this._rowNum++;
                    step--;
                }

                /* Fetch from prefetch cache */
                while (step > 0 && (_this._row = _this._fetchCache.shift())) {
                    _this._rowNum++;
                    step--;
                }
                if (_this._fetchedAll) {
                    _this._rowNum++;
                    _this.emit('eof');
                    return;
                }

                if (!step || _this._fetchedAll)
                    return;

                await _this._fetchRows();
            }
        });
        if (!silent)
            this.emit('move', this.row, this._rowNum);
        return this._rowNum;
    }

    /**
     *
     */
    async _fetchRows(): Promise<void> {
        if (!this._intlcur)
            throw new Error('Cursor is closed');
        let rows = await this._intlcur.fetch(this._prefetchRows)
        if (rows && rows.length) {
            debug('Fetched %d rows from database', rows.length);
            // Normalize rows
            rows = normalizeRows(this._fields, this._intlcur.rowType, rows, {
                objectRows: this._request.objectRows,
                ignoreNulls: this._request.ignoreNulls,
            });
            callFetchHooks(rows, this._request);
            for (const [idx, row] of rows.entries()) {
                this.emit('fetch', row, (this._rowNum + idx + 1));
            }
            /* Add rows to cache */
            if (this._cache) {
                this._cache.push(...rows);
            } else
                this._fetchCache.push(...rows);

            this._fetchedRows += rows.length;
            return;
        }
        this._fetchedAll = true;
        return this.close();
    }

    emit(event: 'close'): boolean;
    emit(event: 'error', error: Error): boolean;
    emit(event: 'eof'): boolean;
    emit(event: 'reset'): boolean;
    emit(event: 'move', row: any, rowNum: number): boolean;
    emit(event: 'fetch', row: any, rowNum: number): boolean;
    emit(event: string | symbol, ...args: any[]): boolean {
        return super.emit(event, ...args);
    }

    on(event: 'close', listener: () => void): this;
    on(event: 'error', listener: (error: Error) => void): this;
    on(event: 'eof', listener: () => void): this;
    on(event: 'reset', listener: () => void): this;
    on(event: 'move', listener: (row: any, rowNum: number) => void): this;
    on(event: 'fetch', listener: (row: any, rowNum: number) => void): this;
    on(event: string | symbol, listener: (...args: any[]) => void): this {
        return super.on(event, listener);
    }

    once(event: 'close', listener: () => void): this;
    once(event: 'error', listener: (error: Error) => void): this;
    once(event: 'eof', listener: () => void): this;
    once(event: 'reset', listener: () => void): this;
    once(event: 'move', listener: (row: any, rowNum: number) => void): this;
    once(event: 'fetch', listener: (row: any, rowNum: number) => void): this;
    once(event: string | symbol, listener: (...args: any[]) => void): this {
        return super.once(event, listener);
    }

    off(event: 'close', listener: () => void): this;
    off(event: 'error', listener: (error: Error) => void): this;
    off(event: 'eof', listener: () => void): this;
    off(event: 'reset', listener: () => void): this;
    off(event: 'move', listener: (row: any, rowNum: number) => void): this;
    off(event: 'fetch', listener: (row: any, rowNum: number) => void): this;
    off(event: string | symbol, listener: (...args: any[]) => void): this {
        return super.off(event, listener);
    }

    addListener(event: 'close', listener: () => void): this;
    addListener(event: 'error', listener: (error: Error) => void): this;
    addListener(event: 'eof', listener: () => void): this;
    addListener(event: 'reset', listener: () => void): this;
    addListener(event: 'move', listener: (row: any, rowNum: number) => void): this;
    addListener(event: 'fetch', listener: (row: any, rowNum: number) => void): this;
    addListener(event: string | symbol, listener: (...args: any[]) => void): this {
        return super.addListener(event, listener);
    }

    removeListener(event: 'close', listener: () => void): this;
    removeListener(event: 'error', listener: (error: Error) => void): this;
    removeListener(event: 'eof', listener: () => void): this;
    removeListener(event: 'reset', listener: () => void): this;
    removeListener(event: 'move', listener: (row: any, rowNum: number) => void): this;
    removeListener(event: 'fetch', listener: (row: any, rowNum: number) => void): this;
    removeListener(event: string | symbol, listener: (...args: any[]) => void): this {
        return super.removeListener(event, listener);
    }

    removeAllListeners(event: 'close'): this;
    removeAllListeners(event: 'error'): this;
    removeAllListeners(event: 'eof'): this;
    removeAllListeners(event: 'reset'): this;
    removeAllListeners(event: 'move'): this;
    removeAllListeners(event: 'fetch'): this;
    removeAllListeners(event: string | symbol): this {
        return super.removeAllListeners(event);
    }

    listeners(event: 'close'): Function[];
    listeners(event: 'error'): Function[];
    listeners(event: 'eof'): Function[];
    listeners(event: 'reset'): Function[];
    listeners(event: 'move'): Function[];
    listeners(event: 'fetch'): Function[];
    listeners(event: string | symbol): Function[] {
        return super.listeners(event);
    }

    rawListeners(event: 'close'): Function[];
    rawListeners(event: 'error'): Function[];
    rawListeners(event: 'eof'): Function[];
    rawListeners(event: 'reset'): Function[];
    rawListeners(event: 'move'): Function[];
    rawListeners(event: 'fetch'): Function[];
    rawListeners(event: string | symbol): Function[] {
        return super.rawListeners(event);
    }

    listenerCount(event: 'close'): number;
    listenerCount(event: 'error'): number;
    listenerCount(event: 'eof'): number;
    listenerCount(event: 'reset'): number;
    listenerCount(event: 'move'): number;
    listenerCount(event: 'fetch'): number;
    listenerCount(event: string | symbol): number {
        return super.listenerCount(event);
    }

    prependListener(event: 'close', listener: () => void): this;
    prependListener(event: 'error', listener: (error: Error) => void): this;
    prependListener(event: 'eof', listener: () => void): this;
    prependListener(event: 'reset', listener: () => void): this;
    prependListener(event: 'move', listener: (row: any, rowNum: number) => void): this;
    prependListener(event: 'fetch', listener: (row: any, rowNum: number) => void): this;
    prependListener(event: string | symbol, listener: (...args: any[]) => void): this {
        return super.prependListener(event, listener);
    }

    prependOnceListener(event: 'close', listener: () => void): this;
    prependOnceListener(event: 'error', listener: (error: Error) => void): this;
    prependOnceListener(event: 'eof', listener: () => void): this;
    prependOnceListener(event: 'reset', listener: () => void): this;
    prependOnceListener(event: 'move', listener: (row: any, rowNum: number) => void): this;
    prependOnceListener(event: 'fetch', listener: (row: any, rowNum: number) => void): this;
    prependOnceListener(event: string | symbol, listener: (...args: any[]) => void): this {
        return super.prependOnceListener(event, listener);
    }

}
