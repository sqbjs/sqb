import '../../_support/env';
import '@sqb/postgres';
import assert from 'assert';
import {Eq} from '@sqb/builder';
import {SqbClient} from '@sqb/connect';
import {Customer} from '../../_support/customers.entity';
import {Country} from '../../_support/countries.entity';
import {initClient} from '../../_support/init-client';

describe('findAll() One-2-One lazy', function () {

    let client: SqbClient;
    before(() => client = initClient());

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
        assert.deepStrictEqual(x, Object.assign(new Country(), {
            code: 'US',
            name: 'United States',
            phoneCode: '+1',
            continentCode: 'AM'
        }));
    });

    it('should specify returning columns', async function () {
        const repo = client.getRepository<Customer>(Customer);
        const rows = await repo.findAll({
            filter: [Eq('id', 1)],
            elements: ['id', 'countryCode', 'countryLazy.continentCode']
        });
        assert.ok(rows);
        assert.ok(rows.length);
        assert.strictEqual(rows[0].id, 1);
        assert.strictEqual(rows[0].countryCode, 'US');
        let x = await rows[0].countryLazy();
        assert.ok(typeof x === 'object');
        assert.ok(!Array.isArray(x));
        assert.deepStrictEqual(x, Object.assign(new Country(), {
            continentCode: 'AM'
        }));
        x = await rows[0].countryLazy({elements: ['phoneCode']});
        assert.ok(typeof x === 'object');
        assert.ok(!Array.isArray(x));
        assert.deepStrictEqual(x, Object.assign(new Country(), {
            phoneCode: '+1'
        }));
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
