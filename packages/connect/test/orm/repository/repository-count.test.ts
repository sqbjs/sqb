import '../../_support/env';
import '@sqb/postgres';
import assert from 'assert';
import {SqbClient} from '@sqb/connect';
import {initClient} from '../../_support/init-client';
import {Country} from '../../_support/countries.entity';

describe('count()', function () {

    let client: SqbClient;
    before(() => client = initClient());

    it('should return number of rows', async function () {
        const repo = client.getRepository<Country>(Country);
        const c = await repo.count();
        assert.ok(c > 0);
    });

    it('should return number of filtered rows', async function () {
        const repo = client.getRepository<Country>(Country);
        const c = await repo.count();
        const c2 = await repo.count({filter: {continentCode: 'AM'}});
        assert.ok(c > 0);
        assert.ok(c2 > 0);
        assert.ok(c > c2);
    });

    it('should filter by one-2-one relation element', async function () {
        const repo = client.getRepository<Country>(Country);
        const c = await repo.count();
        const c2 = await repo.count({filter: {'continent.code': 'AM'}});
        assert.ok(c > 0);
        assert.ok(c2 > 0);
        assert.ok(c > c2);
    });

    it('should filter by one-2-many relation element', async function () {
        const repo = client.getRepository<Country>(Country);
        const c2 = await repo.count({filter: {'customers.countryCode': 'DE'}});
        assert.strictEqual(c2, 1);
    });

});
