/* eslint-disable */

// import {TestMetaOperator} from  require('./test_metaoperator');

import {
    Adapter,
    ConnectionConfiguration,
    PreparedQuery
} from '@sqb/connect';
import {ParamType} from '@sqb/core';

let sessionId = 0;

export const data: any = {};

fillTable('schemas');
fillTable('tables');
fillTable('columns');
fillTable('primary_keys');
fillTable('foreign_keys');
fillTable('airports');

function fillTable(tableName) {
    const obj = require('./db/' + tableName + '.json');
    data[tableName] = {
        fields: obj.fields,
        rows: obj.rows
    };
    if (tableName === 'airports') {
        for (const t of obj.rows)
            t.datevalue = new Date();
    }
    let i = 1;
    for (const t of obj.rows)
        t.rowNum = i++;
}

export class TestAdapter implements Adapter {

    driver = 'test-driver';
    dialect = 'test-dialect';
    paramType = ParamType.COLON;
    _data: any;

    constructor() {
        this._data = JSON.parse(JSON.stringify(data));
    }

    async connect(config: ConnectionConfiguration): Promise<Adapter.Session> {
        if (module.exports.errorCreateConnection)
            throw new Error('Any error');
        return new TestSession(this, config);
    }

    recordCount(table: string): number {
        return this._data[table] && this._data[table].rows.length;
    }
}

class TestSession implements Adapter.Session {

    sessionId: number;
    _closed: boolean;
    _pingCount: number = 0;
    _data: any;
    _transactionCounter = 0;

    constructor(public adapter: TestAdapter, config: ConnectionConfiguration) {
        this.sessionId = ++sessionId;
        this._data = adapter._data;
    }

    get isClosed() {
        return this._closed;
    }

    async close() {
        this._closed = true;
    }

    async reset() {
        return this.rollback();
    }

    async execute(query: PreparedQuery): Promise<Adapter.Response> {

        if (this.isClosed)
            throw new Error('Can not execute while connection is closed');

        let sql = query.sql;

        if (sql.substring(0, 6) === 'select') {
            if (sql === 'select 1')
                return {fields: [{name: 'field1'}], rows: [['1']], rowType: 'array'};

            const m = sql.match(/\bfrom (\w+)\b/i);
            const tableName = m && m[1];
            if (!tableName)
                throw new Error('Invalid query');

            const o = data[tableName];
            if (!o)
                throw new Error(`Table unknown (${tableName}`);
            const out: any = {fields: [...o.fields]};
            // Clone records
            let i;
            let len = query.createCursor ? o.rows.length :
                Math.min(o.rows.length, query.fetchRows ? query.fetchRows : o.rows.length);
            const rows = [];
            out.rowType = 'object';
            for (i = 0; i < len; i++)
                rows.push({...o.rows[i]});

            if (query.createCursor) {
                out.cursor = new TestCursor(this, rows);
            } else out.rows = rows;
            return out;
        }
        if (sql.substring(0, 6) === 'insert') {
            const m = sql.match(/\binto (\w+)\b/i);
            const tableName = m && m[1];
            this._data[tableName].rows.push(query.values);
            if (sql.includes('returning'))
                return {returns: query.values, rowsAffected: 1};
            return {rowsAffected: 1};
        }

        if (sql === 'no response')
            return;

        throw new Error('Unknown test SQL');
    }

    async startTransaction(): Promise<void> {
        if (!this._transactionCounter)
            this._data = JSON.parse(JSON.stringify(this._data));
        this._transactionCounter++;
    }

    async commit(): Promise<void> {
        this._transactionCounter = 0;
        this.adapter._data = this._data;
    }

    async rollback(): Promise<void> {
        this._transactionCounter = 0;
        this._data = this.adapter._data;
    }

    async ping(): Promise<void> {
        this._pingCount++;
    }

    get(param) {
        if (param === 'server_version')
            return '12.0';
    }
}

/**
 *
 * @param conn
 * @param rows
 * @constructor
 */
class TestCursor implements Adapter.Cursor {

    private _rowNum = 0;

    constructor(public session: TestSession, private _rows: any) {
    }

    async close() {
    }

    async fetch(rowCount: number): Promise<any> {
        if (!rowCount)
            return;
        const rowNum = this._rowNum;
        this._rowNum += rowCount;
        return this._rows.slice(rowNum, this._rowNum);
    }

}
