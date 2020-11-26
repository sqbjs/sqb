import './_support/env';
import {Connection, stringifyValueForSQL} from 'postgresql-client';
import {PgAdapter} from '../src/PgAdapter';
import {getInsertSQLsForTestData, initAdapterTests} from '../../connect/test/shared/adapter-tests';

describe('PgAdapter', function () {
    const adapter = new PgAdapter();
    const _createDatabase = true;

    if (_createDatabase) {
        before(async () => {
            this.timeout(30000);
            this.slow(1000);
            const connection = new Connection();
            await connection.connect();
            try {
                await createTestSchema(connection);
            } finally {
                await connection.close(0);
            }
        })
    }

    const env = process.env;
    initAdapterTests(adapter, {
        host: env.PGHOST,
        port: parseInt(env.PGPORT, 10) || undefined,
        database: env.PGDATABASE,
        user: env.PGUSER,
        password: env.PGPASSWORD,
        schema: env.PGSCHEMA
    });

});

async function createTestSchema(connection: Connection) {
    const structureScript = (await import('./_support/db_schema')).sql;
    await connection.execute(structureScript);
    const dataFiles = getInsertSQLsForTestData({stringifyValueForSQL});
    for (const table of dataFiles)
        await connection.execute(table.scripts.join(';\n'));
}