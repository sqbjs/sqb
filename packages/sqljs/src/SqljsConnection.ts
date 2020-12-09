import {Adapter, QueryRequest} from '@sqb/connect';
import {SqlJs} from 'sql.js/module';
import {SqljsCursor} from './SqljsCursor';

export class SqljsConnection implements Adapter.Connection {
    private readonly intlcon: SqlJs.Database;

    constructor(db: SqlJs.Database) {
        this.intlcon = db;
    }

    get sessionId(): any {
        return 0;
    }

    async close() {
        // Dont close
    }

    async reset() {
        return this.rollback();
    }

    async startTransaction(): Promise<void> {
        try {
            this.intlcon.exec('BEGIN TRANSACTION;');
        } catch (e) {
            if (e.message.match(/within a transaction/))
                return;
            throw e;
        }
    }

    async commit(): Promise<void> {
        try {
            this.intlcon.exec('COMMIT;');
        } catch (e) {
            if (e.message.match(/no transaction/))
                return;
            throw e;
        }
    }

    async rollback(): Promise<void> {
        try {
            this.intlcon.exec('ROLLBACK;');
        } catch (e) {
            if (e.message.match(/no transaction/))
                return;
            throw e;
        }
    }

    async test(): Promise<void> {
        this.intlcon.exec('select 1');
    }

    async execute(query: QueryRequest): Promise<Adapter.Response> {
        if (!query.autoCommit)
            await this.startTransaction();
        const out: Adapter.Response = {};
        const m = query.sql.match(/\b(insert into|update|delete from)\b (\w+)/i);
        if (m) {
            this.intlcon.run(query.sql);
            out.rowsAffected = this.intlcon.getRowsModified();
            if (out.rowsAffected && query.returningFields) {
                // Emulate insert into ... returning
                if (m[1].toLowerCase() === 'insert into') {
                    const fields = Object.keys(query.returningFields);
                    const sql = 'select ' + fields.join(',') +
                        ' from ' + m[2] + ' where rowid=last_insert_rowid();'
                    const r: any[] = this.intlcon.exec(sql);
                    if (r.length) {
                        out.fields = this._convertFields(r[0].columns);
                        out.rows = r[0].values;
                        out.rowType = 'array';
                    }
                    return out;
                } else
                    // Emulate update ... returning
                if (m[1].toLowerCase() === 'update') {
                    const m2 = query.sql.match(/where (.+)/);
                    const fields = Object.keys(query.returningFields);
                    query = {...query};
                    query.sql = 'select ' + fields.join(',') +
                        ' from ' + m[2] +
                        (m2 ? ' where ' + m2[1] : '');
                } else return out;
            }

        }
        const stmt = this.intlcon.prepare(query.sql, query.values);
        const colNames = stmt.getColumnNames();
        if (colNames && colNames.length) {
            out.fields = this._convertFields(colNames);
            const rowType = query.objectRows ? 'object' : 'array';
            out.rowType = rowType;
            const cursor = new SqljsCursor(stmt, {rowType});
            if (query.cursor)
                out.cursor = cursor;
            else {
                out.rows = await cursor.fetch(query.fetchRows || 100);
                stmt.free();
            }
        }
        if (query.autoCommit)
            await this.commit();
        return out;
    }

    _convertFields(fields: string[]) {
        const result: any[] = [];
        for (let i = 0; i < fields.length; i++) {
            const v = fields[i];
            const o: Adapter.Field = {
                fieldName: v,
                dataType: 'any',
                jsType: 'any',
                _inf: {name: v}
            };
            result.push(o);
        }
        return result;
    }

}

