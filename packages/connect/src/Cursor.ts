import {EventEmitter} from "events";
import {Adapter} from './Adapter';
import {Session} from './Session';
import {FieldInfoMap} from './FieldInfoMap';
import DoublyLinked from 'doublylinked';
import TaskQueue from 'putil-taskqueue';
import _debug from 'debug';
import {coerceToInt} from 'putil-varhelpers';
import {callFetchHooks, normalizeRows} from './helpers';
import {ObjectRow, PreparedQuery} from './types';
import {CursorStream, CursorStreamOptions} from './CursorStream';

const debug = _debug('sqb:cursor');

export class Cursor extends EventEmitter {

    private readonly _session: Session;
    private readonly _fields: FieldInfoMap;
    private readonly _prefetchRows: number;
    private readonly _prepared: PreparedQuery;

    private _adapterCursor?: Adapter.Cursor;
    private _taskQueue = new TaskQueue();
    private _fetchCache = new DoublyLinked();
    private _rowNum = 0;
    private _fetchedAll = false;
    private _fetchedRows = 0;
    private _row: any;
    private _cache?: DoublyLinked;

    constructor(session: Session, fields: FieldInfoMap,
                adapterCursor: Adapter.Cursor,
                prepared: PreparedQuery) {
        super();
        this._session = session;
        this._adapterCursor = adapterCursor;
        this._fields = fields;
        this._prepared = prepared;
        this._prefetchRows = prepared?.fetchRows || 100;
    }

    /**
     * Returns the Session instance
     */
    get session() {
        return this._session;
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
        return !this._adapterCursor;
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
        this._cache = new DoublyLinked();
    }

    /**
     * Closes cursor
     */
    async close(): Promise<void> {
        if (!this._adapterCursor)
            return;
        try {
            await this._adapterCursor.close();
            this._adapterCursor = undefined;
            debug('close');
            this.emitSafe('close');
        } catch (err) {
            debug('close-error:', err);
            this.emitSafe('error', err);
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
        if (!step)
            return this.rowNum;

        if (step < 0 && !this._cache)
            throw new Error('To move cursor back, it needs cache to be enabled');

        await this._taskQueue.enqueue((done) => {

            /* If moving backward */
            if (step < 0) {
                /* Seek cache */
                while (step < 0 && this._cache?.cursor) {
                    this._row = this._cache.prev();
                    this._rowNum--;
                    step++;
                }
                return done();
            }

            /* If moving forward */
            const moveForward = () => {
                /* Seek cache */
                if (this._cache) {
                    while (step > 0 && (this._row = this._cache.next())) {
                        this._rowNum++;
                        step--;
                    }
                }
                /* Fetch from prefetch cache */
                while (step > 0 && (this._row = this._fetchCache.shift())) {
                    this._rowNum++;
                    step--;
                }
                if (!step || this._fetchedAll)
                    return done();
                /* Fetch records from db */
                this._fetchRows().then(() => {
                    if (this._fetchedAll) {
                        this._row = null;
                        this._rowNum++;
                        if (this._cache)
                            this._cache.next();
                        return done();
                    }
                    setImmediate(() => moveForward());
                }).catch(e => done(e));
            };

            moveForward();
        });
        if (!silent)
            this.emitSafe('move', this._rowNum, this.row);
        return this._rowNum;
    }

    /**
     *
     */
    async _fetchRows(): Promise<void> {
        if (!this._adapterCursor)
            throw new Error('Cursor is closed');
        const rows = await this._adapterCursor.fetch(this._prefetchRows)
        if (rows && rows.length) {
            debug('Fetched %d rows from database', rows.length);
            // Normalize rows
            normalizeRows(this._fields, 'object', rows, {
                objectRows: this._prepared.objectRows,
                ignoreNulls: this._prepared.ignoreNulls
            });
            callFetchHooks(rows, this._prepared);
            for (const [idx, row] of rows.entries()) {
                this.emitSafe('fetch', row, (this._rowNum + idx + 1));
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
        this.emitSafe('eof');
        return this.close();
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
