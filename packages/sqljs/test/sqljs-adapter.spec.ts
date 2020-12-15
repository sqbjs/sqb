import './_support/env';
import path from 'path';
import {SqljsAdapter} from '../src/SqljsAdapter';
import {getInsertSQLsForTestData, initAdapterTests} from '../../connect/test/_shared/adapter-tests';
import {SqlJs} from 'sql.js/module';

describe('SqljsAdapter', function () {
    const adapter = new SqljsAdapter();
    const dbFile = path.resolve(__dirname, '_support/test.sqlite');

    if (process.env.SKIP_CREATE_DB !== 'true') {
        before(async () => {
            this.timeout(30000);
            this.slow(1000);
            const connection = await adapter.connect({database: dbFile})
            try {
                await createTestSchema((connection as any).intlcon);
            } finally {
                await connection.close();
            }
        })
    }

    initAdapterTests(adapter, {database: dbFile});
});

async function createTestSchema(connection: SqlJs.Database) {
    connection.exec(
        (await import('./_support/db_schema')).sql
    );
    const dataFiles = getInsertSQLsForTestData();
    for (const table of dataFiles)
        connection.exec(table.scripts.join(';\n'));
}