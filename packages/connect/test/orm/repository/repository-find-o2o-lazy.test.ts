import '../../_support/env';
import '@sqb/postgres';
import assert from 'assert';
import {Eq} from '@sqb/builder';
import {Customer} from '../../_support/customers.entity';
import {initClient} from '../../_support/init-client';

function toJSON(obj: any): any {
    return JSON.parse(JSON.stringify(obj));
}

describe('findAll() One-2-One lazy', function () {

    const client = initClient();

    it('should resolve record async', async function () {
        const repo = client.getRepository<Customer>(Customer);
        const rows = await repo.findAll({
            filter: [Eq('id', 1)],
            elements: ['id', 'countryCode', 'countryLazy']
        });
        assert.ok(rows);
        assert.ok(rows.length);
        assert.strictEqual(rows[0].id, 1);
        assert.strictEqual(rows[0].countryCode, 'US');
        const x = await rows[0].countryLazy();
        assert.ok(typeof x === 'object');
        assert.ok(!Array.isArray(x));
        assert.deepStrictEqual(toJSON(x), {
            code: 'US',
            name: 'United States',
            phoneCode: '+1',
            continentCode: 'AM'
        });
    });

    it('should specify returning columns', async function () {
        const repo = client.getRepository<Customer>(Customer);
        const rows = await repo.findAll({
            filter: [Eq('id', 1)],
            elements: ['id', 'countryLazy']
        });
        assert.ok(rows);
        assert.ok(rows.length);
        assert.strictEqual(rows[0].id, 1);
        assert.strictEqual(rows[0].countryCode, 'US');
        let x = await rows[0].countryLazy({elements: ['continentCode']});
        assert.ok(typeof x === 'object');
        assert.ok(!Array.isArray(x));
        assert.deepStrictEqual(toJSON(x), {
            continentCode: 'AM'
        });
        x = await rows[0].countryLazy({elements: ['phoneCode']});
        assert.ok(typeof x === 'object');
        assert.ok(!Array.isArray(x));
        assert.deepStrictEqual(toJSON(x), {
            phoneCode: '+1'
        });
    });

    it('should filter by relational column', async function () {
        const repo = client.getRepository<Customer>(Customer);
        const rows = await repo.findAll({
            elements: ['id', 'countryCode'],
            filter: Eq('countryLazy.continent.code', 'AM')
        });
        for (const row of rows) {
            assert.ok(row.countryCode === 'CA' || row.countryCode === 'US');
        }
    });

});
