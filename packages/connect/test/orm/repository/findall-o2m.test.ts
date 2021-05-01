import '../../_support/env';
import assert from 'assert';
import {In} from '@sqb/builder';
import {Country} from '../../_support/countries.entity';
import {initClient} from '../../_support/init-client';
import {Customer} from '../../_support/customers.entity';
import {Continent} from '../../_support/continents.entity';

describe('findAll() one-to-many (hasMany) associations', function () {

    const client = initClient();

    it('should return associated instances', async function () {
        const repo = client().getRepository(Country);
        const rows = await repo.findAll({
            filter: [In('code', ['DE', 'TR'])],
            elements: ['code', 'customers']
        });
        assert.ok(rows);
        assert.ok(rows.length);
        for (const country of rows) {
            assert.ok(Array.isArray(country.customers));
            assert.ok(country.customers.length);
            for (const customer of country.customers) {
                assert.strictEqual(customer.countryCode, country.code);
            }
        }
    });

    it('should return multi level associated instances', async function () {
        const repo = client().getRepository(Continent);
        const rows = await repo.findAll({
            filter: {code: 'AM'},
            elements: ['countries.customers']
        });
        assert.ok(rows);
        assert.ok(rows.length);
        for (const continent of rows) {
            assert.strictEqual(continent.code, 'AM');
            assert.ok(Array.isArray(continent.countries));
            for (const country of continent.countries) {
                assert.strictEqual(country.continentCode, continent.code);
                assert.ok(Array.isArray(country.customers));
                for (const customer of country.customers) {
                    assert.strictEqual(customer.countryCode, country.code);
                }
            }
        }
    });

    it('should specify returning elements', async function () {
        const repo = client().getRepository(Country);
        const rows = await repo.findAll({
            filter: [In('code', ['DE', 'TR'])],
            elements: ['code', 'customers.givenName']
        });
        assert.ok(rows);
        assert.strictEqual(rows.length, 2);
        for (const country of rows) {
            assert.ok(Array.isArray(country.customers));
            assert.ok(country.customers.length);
            const customer = country.customers[0];
            assert.strictEqual(customer.countryCode, country.code);
            assert.deepStrictEqual(Object.keys(customer), ['givenName', 'countryCode']);
        }
    });

    it('should limit maximum association levels', async function () {
        const repo = client().getRepository(Customer);
        await repo.findAll({
            elements: ['country.continent'],
            maxRelationLevel: 1
        });
        await assert.rejects(() => repo.findAll({
            elements: ['country.continent'],
            maxRelationLevel: 0
        }), /exceeds maximum/);
    });

    it('should detect circular queries', async function () {
        const repo = client().getRepository(Customer);
        await assert.rejects(() => repo.findAll({
            filter: {id: 1},
            elements: ['country.customers']
        }), /Circular/);
    });

});
