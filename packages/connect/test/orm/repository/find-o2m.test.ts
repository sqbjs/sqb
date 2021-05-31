import '../../_support/env';
import assert from 'assert';
import {Eq, In} from '@sqb/builder';
import {Country} from '../../_support/country.entity';
import {initClient} from '../../_support/init-client';
import {Customer} from '../../_support/customer.entity';
import {Continent} from '../../_support/continent.entity';

describe('find() one to many relations', function () {

    const client = initClient();

    describe('linkToMany', function () {

        it('return associated rows as array property', async function () {
            const repo = client().getRepository(Continent);
            const rows = await repo.findAll({
                elements: ['code', 'countries']
            });
            assert.ok(rows);
            assert.ok(rows.length);
            for (const continent of rows) {
                assert.ok(Array.isArray(continent.countries));
                assert.ok(continent.countries.length);
                for (const country of continent.countries) {
                    assert.strictEqual(country.continentCode, continent.code);
                }
            }
        });

        it('choice which elements will be returned by server', async function () {
            const repo = client().getRepository(Country);
            const rows = await repo.findAll({
                filter: [In('code', ['DE', 'TR'])],
                elements: ['code', 'customers.givenName', 'customers.countryCode']
            });
            assert.ok(rows);
            assert.strictEqual(rows.length, 2);
            for (const country of rows) {
                assert.ok(Array.isArray(country.customers));
                assert.ok(country.customers.length);
                for (const customer of country.customers) {
                    assert.deepStrictEqual(Object.keys(customer), ['givenName', 'countryCode']);
                    assert.strictEqual(customer.countryCode, country.code);
                }
            }
        });

        it('sort associated instances', async function () {
            const repo = client().getRepository(Country);
            const rows = await repo.findAll({
                elements: ['code', 'customers'],
                sort: ['code', 'customers.givenName']
            });
            assert.ok(rows);
            assert.ok(rows.length);
            const sortedCountries = [...rows];
            sortedCountries.sort((a, b) => {
                if (a.code < b.code) return -1
                if (a.code > b.code) return 1
                return 0;
            });

            for (let i = 0; i < rows.length; i++) {
                const country = rows[i];
                assert.strictEqual(country.code, sortedCountries[i].code);
                if (!country.customers)
                    continue;
                assert.ok(Array.isArray(country.customers));
                const sortedCustomers = [...country.customers];
                sortedCustomers.sort((a, b) => {
                    if (a.givenName < b.givenName) return -1
                    if (a.givenName > b.givenName) return 1
                    return 0;
                });
                for (let k = 0; k < country.customers.length; k++) {
                    const customer = country.customers[k];
                    assert.strictEqual(customer.givenName, sortedCustomers[k].givenName);
                }
            }
        });

        it('query indirect associations', async function () {
            const repo = client().getRepository(Continent);
            const rows = await repo.findAll({
                filter: {code: 'AM'},
                elements: ['code', 'countries.continentCode', 'countries.customers', 'countries.code']
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

        it('limit maximum sub queries', async function () {
            const repo = client().getRepository(Country);
            let r = await repo.findAll({
                elements: ['code', 'customers.id'],
                maxSubQueries: 1
            });
            assert.ok(r);
            assert.ok(r.length);
            assert.ok(r[0].code);
            assert.ok(r[0].customers);

            r = r = await repo.findAll({
                elements: ['code', 'customers.id'],
                maxSubQueries: 0
            });
            assert.ok(r);
            assert.ok(r.length);
            assert.ok(r[0].code);
            assert.strictEqual(r[0].customers, undefined);
        });

        it('limit maximum number of eager items', async function () {
            const repo = client().getRepository(Country);
            assert.rejects(async () => await repo.findAll({
                elements: ['code', 'customers.id'],
                maxEagerFetch: 5
            }), /maximum/);
        });

        it('detect circular queries', async function () {
            const repo1 = client().getRepository(Country);
            assert.rejects(() => repo1.findAll({
                filter: {code: 'US'},
                elements: ['code', 'customers.country']
            }), /Circular/);

            const repo2 = client().getRepository(Customer);
            assert.rejects(() => repo2.findAll({
                filter: {code: 'US'},
                elements: ['id', 'country.code', 'country.customers.country']
            }), /Circular/);
        });

    })

    describe('linkFromMany', function () {

        it('return associated rows as array property', async function () {
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

        it('query indirect associations', async function () {
            const repo = client().getRepository(Continent);
            const rows = await repo.findAll({
                filter: {code: 'AM'},
                elements: ['code', 'countries.continentCode', 'countries.customers', 'countries.code']
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

        it('choice which elements will be returned by server', async function () {
            const repo = client().getRepository(Country);
            const rows = await repo.findAll({
                filter: [In('code', ['DE', 'TR'])],
                elements: ['code', 'customers.givenName', 'customers.countryCode']
            });
            assert.ok(rows);
            assert.strictEqual(rows.length, 2);
            for (const country of rows) {
                assert.ok(Array.isArray(country.customers));
                assert.ok(country.customers.length);
                for (const customer of country.customers) {
                    assert.deepStrictEqual(Object.keys(customer), ['givenName', 'countryCode']);
                    assert.strictEqual(customer.countryCode, country.code);
                }
            }
        });

        it('limit maximum sub queries', async function () {
            const repo = client().getRepository(Country);
            let r = await repo.findAll({
                elements: ['code', 'customers.id'],
                maxSubQueries: 1
            });
            assert.ok(r);
            assert.ok(r.length);
            assert.ok(r[0].code);
            assert.ok(r[0].customers);

            r = r = await repo.findAll({
                elements: ['code', 'customers.id'],
                maxSubQueries: 0
            });
            assert.ok(r);
            assert.ok(r.length);
            assert.ok(r[0].code);
            assert.strictEqual(r[0].customers, undefined);
        });

        it('throw if eager rows exceeds limit', async function () {
            const repo = client().getRepository(Country);
            assert.rejects(async () => await repo.findAll({
                elements: ['code', 'customers.id'],
                maxEagerFetch: 5
            }), /maximum/);
        });

        it('detect circular queries', async function () {
            const repo1 = client().getRepository(Country);
            assert.rejects(() => repo1.findAll({
                filter: {code: 'US'},
                elements: ['code', 'customers.country']
            }), /Circular/);

            const repo2 = client().getRepository(Customer);
            assert.rejects(() => repo2.findAll({
                filter: {code: 'US'},
                elements: ['id', 'country.code', 'country.customers.country']
            }), /Circular/);
        });
    })

    describe('Association chain', function () {

        it('associations with target conditions', async function () {
            const repo = client().getRepository(Country);
            const rows = await repo.findAll({
                filter: [Eq('code', 'US')],
                elements: ['code', 'vipCustomers']
            });
            assert.ok(rows);
            assert.ok(rows.length);
            for (const country of rows) {
                assert.ok(Array.isArray(country.vipCustomers));
                assert.ok(country.vipCustomers.length);
                for (const customer of country.vipCustomers) {
                    assert.strictEqual(!!customer.vip, true);
                }
            }
        });

    })

});
