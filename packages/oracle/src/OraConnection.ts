import oracledb from 'oracledb';
import {Adapter, QueryRequest} from '@sqb/connect';
import {OraCursor} from './OraCursor';

const dataTypeNames = {
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
        this._inTransaction = true;
    }

    async commit(): Promise<void> {
        if (!this.intlcon)
            return;
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
        if (!this.intlcon)
            return;
        await this.intlcon.execute('select 1 from dual', [], {});
    }

    onGenerateQuery(prepared: QueryRequest): void {
        prepared.dialect = 'oracle';
        prepared.dialectVersion = this.serverVersion;
    }

    async execute(request: QueryRequest): Promise<Adapter.Response> {
        if (!this.intlcon)
            throw new Error('Can not execute while db session is closed');

        const oraOptions: oracledb.ExecuteOptions = {
            autoCommit: request.autoCommit || !this._inTransaction,
            extendedMetaData: true,
            resultSet: request.cursor,
            outFormat: request.objectRows ? oracledb.OUT_FORMAT_OBJECT : oracledb.OUT_FORMAT_ARRAY
        };
        if (request.cursor)
            oraOptions.fetchArraySize = request.fetchRows;
        else
            oraOptions.maxRows = request.fetchRows;
        let params = request.values;

        const out: Adapter.Response = {}

        if (request.returningFields) {
            out.fields = [];
            const rprms = request.returningFields;
            if (Array.isArray(params))
                params = params.slice();
            else params = Object.assign({}, params);
            for (const n of Object.keys(rprms)) {
                const o = {type: oracledb.STRING, dir: oracledb.BIND_OUT};
                switch (rprms[n]) {
                    case 'string':
                        o.type = oracledb.STRING;
                        break;
                    case 'number':
                        o.type = oracledb.NUMBER;
                        break;
                    case 'date':
                        o.type = oracledb.DATE;
                        break;
                    case 'blob':
                        o.type = oracledb.BLOB;
                        break;
                    case 'clob':
                        o.type = oracledb.CLOB;
                        break;
                    case 'buffer':
                        o.type = oracledb.BUFFER;
                        break;
                }
                if (Array.isArray(params))
                    params.push(o);
                else params[n] = o;
                const fieldName = n.replace('returning$', '');

                out.fields.push({
                    fieldName,
                    dataType: dataTypeNames[o.type],
                    jsType: fetchTypeMap[o.type]
                } as Adapter.Field)
            }
        }

        this.intlcon.action = request.action || '';
        const response = await this.intlcon.execute<any>(request.sql, params || [], oraOptions);

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
        } else if (response.outBinds) {
            out.rows = [{}];
            out.rowType = 'object';
            const row = out.rows[0];
            for (const n of Object.keys(response.outBinds)) {
                const v = response.outBinds[n];
                row[n.replace('returning$', '')] =
                    v.length === 1 ? v[0] : v;
            }
        }

        if (response.rowsAffected)
            out.rowsAffected = response.rowsAffected;

        return out;
    }

}
