import assert from 'assert';
import {Adapter, QueryRequest, DataType} from '@sqb/connect';
import {Connection, DataTypeOIDs, FieldInfo, OID, QueryOptions} from 'postgresql-client';

const SqbDataTypToOIDMap = {
    [DataType.BOOL]: DataTypeOIDs.bool,
    [DataType.CHAR]: DataTypeOIDs.char,
    [DataType.VARCHAR]: DataTypeOIDs.varchar,
    [DataType.SMALLINT]: DataTypeOIDs.int2,
    [DataType.INTEGER]: DataTypeOIDs.int4,
    [DataType.BIGINT]: DataTypeOIDs.int8,
    [DataType.FLOAT]: DataTypeOIDs.float4,
    [DataType.DOUBLE]: DataTypeOIDs.float8,
    [DataType.NUMBER]: DataTypeOIDs.float8,
    [DataType.DATE]: DataTypeOIDs.date,
    [DataType.TIMESTAMP]: DataTypeOIDs.timestamp,
    [DataType.TIMESTAMPTZ]: DataTypeOIDs.timestamptz,
    [DataType.TIME]: DataTypeOIDs.time,
    [DataType.BINARY]: DataTypeOIDs.bytea,
    [DataType.TEXT]: DataTypeOIDs.text,
    [DataType.GUID]: DataTypeOIDs.uuid,
}

export class PgConnection implements Adapter.Connection {
    private intlcon?: Connection;

    constructor(conn: Connection) {
        this.intlcon = conn;
    }

    get sessionId(): any {
        return this.intlcon && this.intlcon.processID;
    }

    async close() {
        if (!this.intlcon)
            return;
        await this.intlcon.close(0);
        this.intlcon = undefined;
    }

    async reset() {
        return this.rollback();
    }

    async startTransaction(): Promise<void> {
        assert.ok(this.intlcon, 'Can not start transaction for a closed db session');
        await this.intlcon.startTransaction();
    }

    async commit(): Promise<void> {
        assert.ok(this.intlcon, 'Can not commit transaction for a closed db session');
        await this.intlcon.commit();
    }

    async rollback(): Promise<void> {
        if (!this.intlcon)
            return;
        await this.intlcon.rollback();
    }

    async test(): Promise<void> {
        assert.ok(this.intlcon, 'DB session is closed');
        await this.intlcon.query('select 1');
    }


    async getSchema(): Promise<string> {
        assert.ok(this.intlcon, 'DB session is closed');
        const r = await this.intlcon.query('SHOW search_path');
        if (r && r.rows && r.rows[0])
            return (r.rows as any)[0][0] as string;
        return '';
    }

    async setSchema(schema: string): Promise<void> {
        assert.ok(this.intlcon, 'Can not set schema of a closed db session');
        await this.intlcon.execute('SET search_path TO ' + schema);
    }

    onGenerateQuery(request: QueryRequest): void {
        if (this.intlcon) {
            // eslint-disable-next-line dot-notation
            request.dialectVersion = this.intlcon.sessionParameters['server_version'];
        }
    }

    async execute(query: QueryRequest): Promise<Adapter.Response> {
        assert.ok(this.intlcon, 'Can not execute query with a closed db session');

        const opts: QueryOptions = {
            autoCommit: query.autoCommit,
            params: query.params,
            cursor: query.cursor,
            fetchCount: query.fetchRows,
            objectRows: query.objectRows
        };
        if (query.fetchAsString) {
            const items = query.fetchAsString.reduce<OID[]>((a, v) => {
                const oid = SqbDataTypToOIDMap[v];
                if (oid)
                    a.push(oid);
                return a;
            }, []);
            if (items.length)
                opts.fetchAsString = items;
        }
        const resp = await this.intlcon.query(query.sql, opts);
        const out: Adapter.Response = {};
        if (resp.fields)
            out.fields = this._convertFields(resp.fields);
        if (resp.rows)
            out.rows = resp.rows;
        if (resp.cursor)
            out.cursor = resp.cursor;
        if (resp.rowType)
            out.rowType = resp.rowType;
        if (resp.rowsAffected)
            out.rowsAffected = resp.rowsAffected;
        return out;
    }

    _convertFields(fields: FieldInfo[]) {
        const result: any[] = [];
        for (let i = 0; i < fields.length; i++) {
            const v = fields[i];
            const o: Adapter.Field = {
                fieldName: v.fieldName,
                dataType: v.dataTypeName,
                elementDataType: v.elementDataTypeName,
                jsType: v.jsType,
                isArray: v.isArray,
                _inf: v
            };
            result.push(o);
        }
        return result;
    }

}

