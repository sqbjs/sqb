import './_support/env';
import {OraAdapter} from '../src/OraAdapter';
import oracledb from 'oracledb';
import {ClientConfiguration} from '@sqb/connect';
import {
    getInsertSQLsForTestData,
    initAdapterTests
} from '../../connect/test/shared/adapter-tests';
import {clientConfigurationToDriver} from '../src/helpers';

describe('OraAdapter', function () {

    const adapter = new OraAdapter();
    const env = process.env;
    const _createDatabase = false;
    const config: ClientConfiguration = {
        driver: 'oracledb',
        host: env.ORAHOST,
        port: parseInt(env.ORAPORT, 10) || 1521,
        database: env.ORADATABASE,
        user: env.ORAUSER,
        password: env.ORAPASSWORD,
        schema: env.ORASCHEMA || 'test',
        defaults: {
            fieldNaming: 'lowercase'
        }
    };

    if (_createDatabase) {
        before(async function () {
            this.timeout(30000);
            const cfg = clientConfigurationToDriver(config);
            const connection = await oracledb.getConnection(cfg);
            try {
                await createTestSchema(connection);
            } catch (e) {
                // eslint-disable-next-line no-console
                console.error(e);
                throw e;
            } finally {
                await connection.close();
            }
        })
    }
    initAdapterTests(adapter, config);

});

async function createTestSchema(connection: oracledb.Connection) {
    const x = (await import('./_support/db_schema'));
    for (const s of x.sqls) {
        await connection.execute(s);
    }
    const dataFiles = getInsertSQLsForTestData({
        schema: process.env.ORASCHEMA || 'test',
        stringifyValueForSQL
    });
    for (const table of dataFiles) {
        let sql = 'begin\n';
        for (const s of table.scripts) {
            sql += '     execute immediate ' + stringifyValueForSQL(s) + ';\n';
        }
        sql += 'execute immediate \'commit\';\n end;'
        await connection.execute(sql);
    }

}

export function stringifyValueForSQL(v: any): string {
    if (typeof v === 'string')
        return "'" + v.replace(/'/g, "''") + "'";
    return '' + v;
}
