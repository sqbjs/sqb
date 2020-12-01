import {Adapter, QueryRequest} from '@sqb/connect';
import {Connection} from 'postgresql-client';
import {FieldInfo} from 'postgresql-client/dist/definitions';

export class PgConnection implements Adapter.Connection {
    private readonly intlcon: Connection;

    constructor(conn: Connection) {
        this.intlcon = conn;
    }

    get sessionId(): any {
        return this.intlcon.processID;
    }

    async close() {
        await this.intlcon.close(0);
    }

    async reset() {
        return this.rollback();
    }

    async startTransaction(): Promise<void> {
        await this.intlcon.startTransaction();
    }

    async commit(): Promise<void> {
        await this.intlcon.commit();
    }

    async rollback(): Promise<void> {
        await this.intlcon.rollback();
    }

    async test(): Promise<void> {
        await this.intlcon.query('select 1');
    }

    onGenerateQuery(request: QueryRequest): void {
        // eslint-disable-next-line dot-notation
        request.dialectVersion = this.intlcon.sessionParameters['server_version'];
    }

    async execute(query: QueryRequest): Promise<Adapter.Response> {
        const resp = await this.intlcon.query(query.sql, {
            autoCommit: query.autoCommit,
            params: query.values,
            cursor: query.cursor,
            fetchCount: query.fetchRows,
            objectRows: query.objectRows
        });
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

