import oracledb from 'oracledb';
import {Adapter, QueryRequest} from '@sqb/connect';

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
        const params = request.values;

        /*
        if (prepared.returningFields) {
            const rprms = query.returningFields;
            if (Array.isArray(params))
                params = params.slice();
            else params = Object.assign({}, params);
            for (const n of Object.keys(rprms)) {
                const o = {dir: oracledb.BIND_OUT};
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
            }
        }*/

        this.intlcon.action = request.action || '';
        const response = await this.intlcon.execute<any>(request.sql, params || [], oraOptions);

        if (response.rows) {
            const out: Adapter.Response = {
                fields: undefined,
                rowType: request.objectRows ? 'object' : 'array',
                rows: response.rows
            };
            const fields = out.fields = {};
            // Create fields metadata
            let rowNumberIdx = -1;
            let rowNumberName = '';
            if (response.metaData) {
                for (const [idx, v] of response.metaData.entries()) {
                    if (v.name.toLowerCase() === 'row$number') {
                        rowNumberIdx = idx;
                        rowNumberName = v.name;
                        continue;
                    }
                    const fieldInfo: Adapter.FieldInfo = {
                        _inf: v,
                        index: idx,
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
                    fields[v.name] = fieldInfo;
                }
            }

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
        }

        return {};
    }

}
