import '../../_support/env';
import assert from 'assert';
import {In} from '@sqb/builder';
import {Entity, Association, hasMany, belongsTo} from '@sqb/connect';
import {Country} from '../../_support/countries.entity';
import {initClient} from '../../_support/init-client';
import {Customer} from '../../_support/customers.entity';
import {Continent} from '../../_support/continents.entity';
import {CustomerTag} from '@sqb/connect/test/_support/customer-tags.entity';
import {Tag} from '@sqb/connect/test/_support/tags.entity';

@Entity({tableName: 'customers'})
class Customer2 extends Customer {
    @Association(hasMany(CustomerTag).hasOne(Tag))
    tag: Tag[];
}

describe.only('findAll() one-to-many link-chain associations', function () {

    const client = initClient();

    it.only('should return instances', async function () {
        const repo = client().getRepository(Customer2);
        const rows = await repo.findAll({
            filter: {'id': 1},
            elements: ['givenName', 'tags']
        });
        assert.strictEqual(rows.length, 1);
        assert.strictEqual(rows[0].id, 1);
        assert.strictEqual(rows.length, 1);
        for (const row of rows) {
            assert.ok(Array.isArray(row.tag));
            assert.ok(row.tag.length);
            for (const tag of row.tag) {
                assert.strictEqual(tag.id, 1);
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
