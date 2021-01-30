import {Adapter, ClientConfiguration} from '@sqb/connect';
import '@sqb/oracle-dialect';
import oracledb from 'oracledb';
import {OraConnection} from './OraConnection';
import {clientConfigurationToDriver} from './helpers';

export class OraAdapter implements Adapter {

    driver = 'oracledb';
    dialect = 'oracle';
    features = {
        cursor: true,
        // fetchAsString: [DataType.DATE, DataType.TIMESTAMP, DataType.TIMESTAMPTZ]
    }

    async connect(config: ClientConfiguration): Promise<Adapter.Connection> {
        const cfg = clientConfigurationToDriver(config);
        // Get oracle connection
        const connection = await oracledb.getConnection(cfg);
        try {
            /* Retrieve sessionId */
            let sessionId;
            const r = await connection.execute<any>('select sid from v$mystat where rownum <= 1', [], {});
            if (r && r.rows)
                sessionId = r.rows[0][0];

            /* Set default schema */
            if (config.schema) {
                await connection.execute('alter SESSION set CURRENT_SCHEMA = ' + config.schema, [], {autoCommit: true});
            }

            return new OraConnection(connection, sessionId);
        } catch (e) {
            if (connection)
                await connection.close();
            throw e;
        }
    }

}
