import fs from 'fs';
import path from 'path';
import {Adapter, ClientConfiguration} from '@sqb/connect';
import '@sqb/sqlite-dialect';
import initSqlJs from 'sql.js';
import {SqlJs} from 'sql.js/module';
import {SqljsConnection} from './SqljsConnection';

const dbCache: Record<string, SqlJs.Database> = {};

export class SqljsAdapter implements Adapter {

    driver = 'sqljs';
    dialect = 'sqlite';
    features = {
        cursor: true,
        // fetchAsString: [DataType.DATE, DataType.TIMESTAMP, DataType.TIMESTAMPTZ]
    }

    async connect(config: ClientConfiguration): Promise<Adapter.Connection> {
        if (!config.database)
            throw new Error('You must provide sqlite database file for sql.js driver');
        const filename = path.resolve(process.cwd(), config.database);
        if (dbCache[filename])
            return new SqljsConnection(dbCache[filename]);
        const filebuffer = fs.readFileSync(filename);
        const SQL = await initSqlJs();
        const db = new SQL.Database(filebuffer);
        dbCache[filename] = db;
        return new SqljsConnection(db);
    }

}
