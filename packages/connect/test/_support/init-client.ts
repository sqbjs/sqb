import {Client} from '@sqb/connect';
import {createTestSchema} from '../../../postgres/test/_support/create-db';

export function initClient(): Client {

    let client = new Client({dialect: 'postgres', defaults: {cursor: true, objectRows: true}})

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
