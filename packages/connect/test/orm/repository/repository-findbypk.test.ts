import '../../_support/env';
import '@sqb/postgres';
import assert from 'assert';
import {Country} from '../../_support/countries.entity';
import {initClient} from '../../_support/init-client';
import {CustomerTag} from '../../_support/customer-tags.entity';

describe('findByPk()', function () {

    const client = initClient();

    it('should return single instance by key value', async function () {
        const repo = client.getRepository<Country>(Country);
        const row = await repo.findByPk('TR');
        assert.ok(row);
        assert.strictEqual(row.code, 'TR');
        assert.strictEqual(row.name, 'Turkey');
    });

    it('should return single instance by object instance', async function () {
        const repo = client.getRepository<Country>(Country);
        const row = await repo.findByPk({code: 'TR'});
        assert.ok(row);
        assert.strictEqual(row.code, 'TR');
        assert.strictEqual(row.name, 'Turkey');
    });

    it('should return instance from multi-key entities', async function () {
        const repo = client.getRepository<CustomerTag>(CustomerTag);
        const row = await repo.findByPk({customerId: 1, tagId: 1});
        assert.ok(row);
        assert.strictEqual(row.customerId, 1);
        assert.strictEqual(row.tagId, 1);
    });

});
