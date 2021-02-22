import '../../_support/env';
import '@sqb/postgres';
import assert from 'assert';
import {SqbClient} from '@sqb/connect';
import {In} from '@sqb/builder';
import {Country} from '../../_support/countries.entity';
import {initClient} from '../../_support/init-client';

describe('findAll() One-2-Many eager', function () {

    let client: SqbClient;
    before(() => client = initClient())

    it('should return relation records in array', async function () {
        const repo = client.getRepository<Country>(Country);
        const rows = await repo.findAll({
            filter: [In('code', ['DE', 'TR'])],
            elements: ['code', 'customers']
        });
        assert.ok(rows);
        assert.strictEqual(rows.length, 2);
        for (const country of rows) {
            assert.ok(Array.isArray(country.customers));
            assert.ok(country.customers.length);
            for (const customer of country.customers) {
                assert.strictEqual(customer.countryCode, country.code);
            }
        }
    });

    it('should specify returning columns', async function () {
        const repo = client.getRepository<Country>(Country);
        const rows = await repo.findAll({
            filter: [In('code', ['DE', 'TR'])],
            elements: ['code', 'customers.givenName']
        });
        assert.ok(rows);
        assert.strictEqual(rows.length, 2);
        for (const country of rows) {
            assert.ok(Array.isArray(country.customers));
            assert.ok(country.customers.length);
            for (const customer of country.customers) {
                assert.strictEqual(customer.countryCode, country.code);
                assert.deepStrictEqual(Object.keys(customer), ['givenName', 'countryCode']);
            }
        }
    });

});
