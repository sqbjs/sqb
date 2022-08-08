import './_support/env';
import {initAdapterTests} from '@sqb/connect/test/_shared/adapter-tests';
import {OraAdapter} from '../src/OraAdapter';
import {createTestSchema, dbConfig} from './_support/create-db';

describe('OraAdapter', function () {

    const adapter = new OraAdapter();

    if (process.env.SKIP_CREATE_DB !== 'true') {
        before(async function () {
            this.timeout(30000);
            await createTestSchema();
        })
    }
    initAdapterTests(adapter, dbConfig);

});

