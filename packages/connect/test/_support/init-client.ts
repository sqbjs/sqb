import {SqbClient, ClientConfiguration} from '@sqb/connect';
import '@sqb/postgres';

// noinspection ES6PreferShortImport
import {createTestSchema} from '../../../postgres/test/_support/create-db';

let client: SqbClient;

export function initClient(config?: ClientConfiguration): () => SqbClient {

    if (process.env.SKIP_CREATE_DB !== 'true') {
        before(async function () {
            this.timeout(30000);
            await createTestSchema('test_sqb_connect');
        })
    }

    after(async () => {
        if (client)
            await client.close(0);
        client = undefined;
    });

    return () => {
        client = client || new SqbClient({
            dialect: 'postgres',
            schema: 'test_sqb_connect',
            ...config
        })
        return client;
    };

}
