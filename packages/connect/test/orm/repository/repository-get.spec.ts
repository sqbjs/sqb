import '../../_support/env';
import '@sqb/postgres';
import assert from 'assert';
import {Country} from '../../_support/countries.entity';
import {initClient} from '../../_support/init-client';
import {CustomerTags} from '../../_support/customer-tags.entity';

describe('Repository "get" operations', function () {

    const client = initClient();

    it('should return single instance by key value', async function () {
        const repo = client.getRepository<Country>(Country);
        const row = await repo.get('TR');
        assert.ok(row);
        assert.strictEqual(row.code, 'TR');
        assert.strictEqual(row.name, 'Turkey');
    });

    it('should return single instance by object instance', async function () {
        const repo = client.getRepository<Country>(Country);
        const row = await repo.get({code: 'TR'});
        assert.ok(row);
        assert.strictEqual(row.code, 'TR');
        assert.strictEqual(row.name, 'Turkey');
    });

    it('should return instance from multi-key entities', async function () {
        const repo = client.getRepository<CustomerTags>(CustomerTags);
        const row = await repo.get({customerId: 2, tag: 'green'});
        assert.ok(row);
        assert.strictEqual(row.customerId, 2);
        assert.strictEqual(row.tag, 'green');
    });

});
