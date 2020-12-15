import './_support/env';
import {PgAdapter} from '../src/PgAdapter';
import {initAdapterTests} from '../../connect/test/_shared/adapter-tests';
import {createTestSchema} from './_support/create-db';

describe('PgAdapter', function () {
    const adapter = new PgAdapter();

    if (process.env.SKIP_CREATE_DB !== 'true') {
        before(async () => {
            this.timeout(30000);
            await createTestSchema();
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
