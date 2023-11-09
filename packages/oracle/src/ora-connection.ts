import assert from 'assert';
import oracledb from 'oracledb';
import {Adapter, QueryRequest} from '@sqb/connect';
import {OraCursor} from './ora-cursor.js';

export const dataTypeNames = {
    [oracledb.DB_TYPE_BFILE]: 'BFILE',
    [oracledb.DB_TYPE_BINARY_DOUBLE]: 'BINARY_DOUBLE',
    [oracledb.DB_TYPE_BINARY_FLOAT]: 'BINARY_FLOAT',
    [oracledb.DB_TYPE_BINARY_INTEGER]: 'BINARY_INTEGER',
    [oracledb.DB_TYPE_BLOB]: 'BLOB',
    [oracledb.DB_TYPE_BOOLEAN]: 'BOOLEAN',
    [oracledb.DB_TYPE_CHAR]: 'CHAR',
    [oracledb.DB_TYPE_CLOB]: 'CLOB',
    [oracledb.DB_TYPE_CURSOR]: 'CURSOR',
    [oracledb.DB_TYPE_DATE]: 'DATE',
    [oracledb.DB_TYPE_INTERVAL_DS]: 'INTERVAL_DS',
    [oracledb.DB_TYPE_INTERVAL_YM]: 'INTERVAL_YM',
    [oracledb.DB_TYPE_LONG]: 'LONG',
    [oracledb.DB_TYPE_LONG_RAW]: 'LONG_RAW',
    [oracledb.DB_TYPE_NCHAR]: 'NCHAR',
    [oracledb.DB_TYPE_NCLOB]: 'NCLOB',
    [oracledb.DB_TYPE_NUMBER]: 'NUMBER',
    [oracledb.DB_TYPE_NVARCHAR]: 'NVARCHAR',
    [oracledb.DB_TYPE_OBJECT]: 'OBJECT',
    [oracledb.DB_TYPE_RAW]: 'RAW',
    [oracledb.DB_TYPE_ROWID]: 'ROWID',
    [oracledb.DB_TYPE_TIMESTAMP]: 'TIMESTAMP',
    [oracledb.DB_TYPE_TIMESTAMP_LTZ]: 'TIMESTAMP_LTZ',
    [oracledb.DB_TYPE_TIMESTAMP_TZ]: 'TIMESTAMP_TZ',
    [oracledb.DB_TYPE_VARCHAR]: 'VARCHAR'
};

const fetchTypeMap = {
    [oracledb.DB_TYPE_BFILE]: 'object',
    [oracledb.DB_TYPE_BINARY_DOUBLE]: 'number',
    [oracledb.DB_TYPE_BINARY_FLOAT]: 'number',
    [oracledb.DB_TYPE_BINARY_INTEGER]: 'number',
    [oracledb.DB_TYPE_BLOB]: 'object',
    [oracledb.DB_TYPE_BOOLEAN]: 'boolean',
    [oracledb.DB_TYPE_CHAR]: 'string',
    [oracledb.DB_TYPE_CLOB]: 'object',
    [oracledb.DB_TYPE_CURSOR]: 'object',
    [oracledb.DB_TYPE_DATE]: 'Date',
    [oracledb.DB_TYPE_INTERVAL_DS]: 'string',
    [oracledb.DB_TYPE_INTERVAL_YM]: 'string',
    [oracledb.DB_TYPE_LONG]: 'number',
    [oracledb.DB_TYPE_LONG_RAW]: 'Buffer',
    [oracledb.DB_TYPE_NCHAR]: 'string',
    [oracledb.DB_TYPE_NCLOB]: 'object',
    [oracledb.DB_TYPE_NUMBER]: 'number',
    [oracledb.DB_TYPE_NVARCHAR]: 'string',
    [oracledb.DB_TYPE_OBJECT]: 'object',
    [oracledb.DB_TYPE_RAW]: 'Buffer',
    [oracledb.DB_TYPE_ROWID]: 'number',
    [oracledb.DB_TYPE_TIMESTAMP]: 'Date',
    [oracledb.DB_TYPE_TIMESTAMP_LTZ]: 'Date',
    [oracledb.DB_TYPE_TIMESTAMP_TZ]: 'Date',
    [oracledb.DB_TYPE_VARCHAR]: 'string'
};

export class OraConnection implements Adapter.Connection {
    private intlcon?: oracledb.Connection;
    public serverVersion: string;
    private _inTransaction = false;

    constructor(conn: oracledb.Connection, public sessionId: string) {
        this.intlcon = conn;
        this.serverVersion = '' + conn.oracleServerVersion;
    }

    async close() {
        if (!this.intlcon)
            return;
        await this.intlcon.close();
        this.intlcon = undefined;
    }

    async reset() {
        return this.rollback();
    }

    async startTransaction(): Promise<void> {
        assert.ok(this.intlcon, 'Can not start transaction for a closed db session');
        this._inTransaction = true;
    }

    async commit(): Promise<void> {
        assert.ok(this.intlcon, 'Can not commit transaction for a closed db session');
        await this.intlcon.commit();
        this._inTransaction = false;
    }

    async rollback(): Promise<void> {
        if (!this.intlcon)
            return;
        await this.intlcon.rollback();
        this._inTransaction = false;
    }

    async test(): Promise<void> {
        assert.ok(this.intlcon, 'DB session is closed');
        await this.intlcon.execute('select 1 from dual', [], {});
    }

    async getSchema(): Promise<string> {
        assert.ok(this.intlcon, 'DB session is closed');
        const r = await this.intlcon.execute('select sys_context( \'userenv\', \'current_schema\' ) from dual',
            [], {autoCommit: true});
        if (r && r.rows && r.rows[0])
            return (r.rows as any)[0][0] as string;
        return '';
    }

    async setSchema(schema: string): Promise<void> {
        assert.ok(this.intlcon, 'Can not set schema of a closed db session');
        await this.intlcon.execute('alter SESSION set CURRENT_SCHEMA = ' + schema,
            [], {autoCommit: true});
    }

    onGenerateQuery(prepared: QueryRequest): void {
        prepared.dialect = 'oracle';
        prepared.dialectVersion = this.serverVersion;
    }

    async execute(request: QueryRequest): Promise<Adapter.Response> {
        assert.ok(this.intlcon, 'Can not execute query with a closed db session');

        const oraOptions: oracledb.ExecuteOptions = {
            autoCommit: request.autoCommit,
            resultSet: request.cursor,
            outFormat: request.objectRows ? oracledb.OUT_FORMAT_OBJECT : oracledb.OUT_FORMAT_ARRAY
        };
        if (request.cursor)
            oraOptions.fetchArraySize = request.fetchRows;
        else
            oraOptions.maxRows = request.fetchRows;

        const out: Adapter.Response = {}

        this.intlcon.action = request.action || '';
        let response = await this.intlcon.execute<any>(request.sql, request.params || [], oraOptions);

        if (response.rowsAffected)
            out.rowsAffected = response.rowsAffected;

        if (out.rowsAffected === 1 && request.returningFields) {
            const m = request.sql.match(/\b(insert into|update)\b ("?\w+\.?\w+"?)/i);
            if (m) {
                const selectFields = request.returningFields.map(
                    x => x.field + (x.alias ? ' as ' + x.alias : ''));
                let sql = `select ${selectFields.join(',')} from ${m[2]}\n`;
                if (m[1].toLowerCase() === 'insert into') {
                    sql += 'where rowid=\'' + response.lastRowid + '\'';
                    response = await this.intlcon.execute(sql);
                } else
                    // Emulate update ... returning
                if (m[1].toLowerCase() === 'update') {
                    const m2 = request.sql.match(/where (.+)/);
                    sql += (m2 ? ' where ' + m2[1] : '');
                    response = await this.intlcon.execute(sql, request.params || [], oraOptions);
                }
            }

        }

        let fields;
        let rowNumberIdx = -1;
        let rowNumberName = '';
        if (response.metaData) {
            fields = out.fields = [];
            for (const [idx, v] of response.metaData.entries()) {
                if (v.name.toLowerCase() === 'row$number') {
                    rowNumberIdx = idx;
                    rowNumberName = v.name;
                    continue;
                }
                const fieldInfo: Adapter.Field = {
                    _inf: v,
                    fieldName: v.name,
                    dataType: v.dbTypeName || 'UNKNOWN',
                    jsType: fetchTypeMap[v.fetchType || 2001]
                };
                if (v.dbTypeName === 'CHAR')
                    fieldInfo.fixedLength = true;
                // others
                if (v.byteSize) fieldInfo.size = v.byteSize;
                if (v.nullable) fieldInfo.nullable = v.nullable;
                if (v.precision) fieldInfo.precision = v.precision;
                fields.push(fieldInfo);
            }
        }

        if (response.rows) {
            out.rowType = request.objectRows ? 'object' : 'array';
            out.rows = response.rows;
            // remove row$number fields
            if (out.rows && rowNumberIdx >= 0) {
                for (const row of out.rows) {
                    if (Array.isArray(row))
                        row.splice(rowNumberIdx, 1);
                    else
                        delete row[rowNumberName];
                }
            }
            return out;
        } else if (response.resultSet) {
            out.rowType = request.objectRows ? 'object' : 'array';
            out.cursor =
                new OraCursor(response.resultSet, {
                    rowType: request.objectRows ? 'object' : 'array',
                    rowNumberIdx, rowNumberName
                });
        }


        return out;
    }

}
