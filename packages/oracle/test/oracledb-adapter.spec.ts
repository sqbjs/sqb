import './_support/env';
import {OraAdapter} from '../src/OraAdapter';
import oracledb from 'oracledb';
import {ClientConfiguration} from '@sqb/connect';
import {
    getInsertSQLsForTestData, stringifyValueForSQL,
    initAdapterTests
} from '../../connect/test/shared/adapter-tests';
import {clientConfigurationToDriver} from '../src/helpers';

describe('OraAdapter', function () {

    const adapter = new OraAdapter();
    const env = process.env;
    const _createDatabase = true;
    const config: ClientConfiguration = {
        driver: 'oracledb',
        host: env.ORAHOST,
        port: parseInt(env.ORAPORT, 10) || 1521,
        database: env.ORADATABASE,
        user: env.ORAUSER,
        password: env.ORAPASSWORD,
        schema: env.ORASCHEMA || 'test'
    };

    if (_createDatabase) {
        before(async () => {
            this.timeout(30000);
            this.slow(1000);
            const connection = await oracledb.getConnection(clientConfigurationToDriver(config));
            try {
                await createTestSchema(connection);
            } finally {
                await connection.close();
            }
        })
    }
    initAdapterTests(adapter, config);

});

async function createTestSchema(connection: oracledb.Connection) {
    const sqls = (await import('./_support/db_schema')).sqls;
    for (const s of sqls) {
        await connection.execute(s);
    }
    const dataFiles = getInsertSQLsForTestData();
    for (const table of dataFiles) {
        let sql = 'begin\n' +
            '     execute immediate\n';
        for (const s of table.scripts) {
            sql += stringifyValueForSQL(s) + ';\n';
        }
        sql += 'end;'
        await connection.execute(sql);
    }

}
