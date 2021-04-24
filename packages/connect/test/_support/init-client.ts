import {SqbClient, ClientConfiguration} from '@sqb/connect';
import '@sqb/postgres';

// noinspection ES6PreferShortImport
import {createTestSchema} from '../../../postgres/test/_support/create-db';

export function initClient(config?: ClientConfiguration): SqbClient {

    let client = new SqbClient({
        dialect: 'postgres',
        schema: process.env.PGSCHEMA || 'test',
        ...config
    })

    if (process.env.SKIP_CREATE_DB !== 'true') {
        before(async function () {
            this.timeout(30000);
            await createTestSchema();
        })
    }

    after(async () => {
        if (client)
            await client.close(0);
        client = undefined;
    });

    return client;

}
