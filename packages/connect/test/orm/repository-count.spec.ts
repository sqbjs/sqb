import '../_support/env';
import '@sqb/postgres';
import assert from 'assert';
import {initClient} from '../_support/init-client';
import {Country} from '../_support/countries.entity';

describe('Repository "count" operations', function () {

    const client = initClient();

    it('count number of rows', async function () {
        const repo = client.getRepository<Country>(Country);
        const c = await repo.count();
        assert.ok(c > 0);
    });

    it('count rows filtered by data column', async function () {
        const repo = client.getRepository<Country>(Country);
        const c = await repo.count();
        const c2 = await repo.count({filter: {continentCode: 'AM'}});
        assert.ok(c > 0);
        assert.ok(c2 > 0);
        assert.ok(c > c2);
    });

    it('count rows filtered by one-2-one relation column', async function () {
        const repo = client.getRepository<Country>(Country);
        const c = await repo.count();
        const c2 = await repo.count({filter: {'continent.code': 'AM'}});
        assert.ok(c > 0);
        assert.ok(c2 > 0);
        assert.ok(c > c2);
    });

    it('count rows filtered by one-2-many relation column', async function () {
        const repo = client.getRepository<Country>(Country);
        const c2 = await repo.count({filter: {'customers.countryCode': 'DE'}});
        assert.strictEqual(c2, 1);
    });

});
