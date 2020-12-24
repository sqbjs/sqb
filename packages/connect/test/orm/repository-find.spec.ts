import '../_support/env';
import '@sqb/postgres';
import assert from 'assert';
import {Eq, In} from '@sqb/builder';
import {Customer} from '../_support/customers.entity';
import {Country} from '../_support/countries.entity';
import {initClient} from '../_support/init-client';
import {Continent} from '../_support/continents.entity';

describe('Repository find operations', function () {

    const client = initClient();

    /**
     *
     */
    describe('find()', function () {

        it('return instances', async function () {
            const repo = client.getRepository<Customer>(Customer);
            const rows = await repo.find();
            assert.ok(rows);
            assert.ok(rows.length);
            assert.ok(rows[0].id);
            assert.ok(rows[0].givenName);
            assert.ok(rows[0].familyName);
        });

        it('specify returning columns', async function () {
            const repo = client.getRepository<Customer>(Customer);
            const rows = await repo.find({
                limit: 1,
                columns: ['id', 'givenName']
            });
            assert.ok(rows);
            assert.deepStrictEqual(Object.keys(rows[0]), ['id', 'givenName']);
        });

        it('return only data columns (if no columns specified)', async function () {
            const repo = client.getRepository<Customer>(Customer);
            const rows = await repo.find();
            assert.ok(rows);
            assert.ok(rows.length);
            assert.ok(rows[0].id);
            assert.ok(rows[0].givenName);
            assert.strictEqual(rows[0].country, undefined);
        });

        it('filter with Operator', async function () {
            const repo = client.getRepository<Country>(Country);
            const rows = await repo.find({filter: Eq('continentCode', 'AM')});
            assert.strictEqual(rows.length, 2);
            assert.strictEqual(rows[0].code, 'CA');
            assert.strictEqual(rows[1].code, 'US');
        });

        it('filter with plain object', async function () {
            const repo = client.getRepository<Country>(Country);
            const rows = await repo.find({filter: {continentCode: 'AM'}});
            assert.strictEqual(rows.length, 2);
            assert.strictEqual(rows[0].code, 'CA');
            assert.strictEqual(rows[1].code, 'US');
        });

        it('limit', async function () {
            const repo = client.getRepository<Customer>(Customer);
            const rows = await repo.find({
                sort: ['id'],
                limit: 5
            });
            assert.ok(rows);
            assert.strictEqual(rows.length, 5);
            assert.strictEqual(rows[0].id, 1);
            assert.strictEqual(rows[4].id, 5);
        });

        it('offset', async function () {
            const repo = client.getRepository<Customer>(Customer);
            const rows = await repo.find({
                sort: ['id'],
                limit: 5,
                offset: 10
            });
            assert.ok(rows);
            assert.strictEqual(rows.length, 5);
            assert.strictEqual(rows[0].id, 11);
            assert.strictEqual(rows[4].id, 15);
        });

        it('sort', async function () {
            const repo = client.getRepository<Customer>(Customer);
            const rows = await repo.find({sort: ['-id']});
            const arr1 = rows.map(x => x.id);
            const arr2 = [...arr1];
            arr2.sort((a, b) => b - a);
            assert.deepStrictEqual(arr1, arr2);
        });

        it('sort by sort-enabled columns only ', async function () {
            const repo = client.getRepository<Customer>(Customer);
            return assert.rejects(() =>
                    repo.find({sort: ['countryCode']}),
                /is not allowed/);
        });

        it('sort by data columns only ', async function () {
            const repo = client.getRepository<Customer>(Customer);
            return assert.rejects(() =>
                    repo.find({sort: ['country']}),
                /Can not sort by/);
        });
    });

    /**
     *
     */
    describe('findOne()', function () {

        it('return single instance', async function () {
            const repo = client.getRepository<Customer>(Customer);
            const row = await repo.findOne({sort: ['id']});
            assert.ok(row);
            assert.strictEqual(row.id, 1);
        });

        it('return single instance from given offset', async function () {
            const repo = client.getRepository<Customer>(Customer);
            const row = await repo.findOne({
                sort: ['id'],
                offset: 10
            });
            assert.ok(row);
            assert.strictEqual(row.id, 11);
        });

    });

    /**
     *
     */
    describe('findByPk()', function () {

        it('return single instance by key field', async function () {
            const repo = client.getRepository<Customer>(Customer);
            const row = await repo.findByPk(1);
            assert.ok(row);
            assert.strictEqual(row.id, 1);
            assert.strictEqual(row.givenName, 'Wynne');
            assert.strictEqual(row.familyName, 'Silva');
        });

    });

    /**
     *
     */
    describe('One-2-One relation (eager)', function () {

        it('return related instance', async function () {
            const repo = client.getRepository<Customer>(Customer);
            const rows = await repo.find({
                filter: [Eq('id', 1)],
                columns: ['id', 'countryCode', 'country']
            });
            assert.ok(rows);
            assert.ok(rows.length);
            assert.strictEqual(rows[0].id, 1);
            assert.strictEqual(rows[0].countryCode, 'US');
            assert.deepStrictEqual(rows[0].country, Object.assign(new Country(), {
                code: 'US',
                name: 'United States',
                phoneCode: '+1',
                continentCode: 'AM'
            }));
        });

        it('return sub o2o related instance', async function () {
            const repo = client.getRepository<Customer>(Customer);
            const rows = await repo.find({
                filter: [Eq('id', 1)],
                columns: ['id', 'country.code', 'country.continent']
            });
            assert.ok(rows);
            assert.ok(rows.length);
            assert.strictEqual(rows[0].id, 1);
            assert.deepStrictEqual(rows[0].country, Object.assign(new Country(), {
                code: 'US',
                continent: Object.assign(new Continent(), {
                    code: 'AM',
                    name: 'America'
                })
            }));
        });

        it('filter by o2o relational column', async function () {
            const repo = client.getRepository<Customer>(Customer);
            const rows = await repo.find({
                columns: ['id', 'countryCode'],
                filter: Eq('country.continent.code', 'AM')
            });
            for (const row of rows) {
                assert.ok(row.countryCode === 'CA' || row.countryCode === 'US');
            }
        });

        it('use "exists" when filtering by o2o relational column', async function () {
            const repo = client.getRepository<Customer>(Customer);
            let sql = '';
            client.once('execute', (request => {
                sql = request.sql;
            }));
            await repo.find({
                columns: ['id'],
                filter: [{'country.continent.code': 'AM'}]
            });
            assert.strictEqual(sql, 'select T.ID as T_ID from customers T where ' +
                'exists (select 1 from countries E1 where E1.code = T.country_code and ' +
                'exists (select 1 from continents E2 where E2.code = E1.continent_code and E2.code = \'AM\'))');
        });

        it('specify returning columns', async function () {
            const repo = client.getRepository<Customer>(Customer);
            const rows = await repo.find({
                filter: [Eq('id', 1)],
                columns: ['id', 'countryCode', 'country.code', 'country.phoneCode']
            });
            assert.ok(rows);
            assert.ok(rows.length);
            assert.strictEqual(rows[0].id, 1);
            assert.strictEqual(rows[0].countryCode, 'US');
            assert.deepStrictEqual(rows[0].country, Object.assign(new Country(), {
                    code: 'US',
                    phoneCode: '+1'
                })
            );
        });

    });

    /**
     *
     */
    describe('One-2-One relation (lazy)', function () {

        it('return instance async', async function () {
            const repo = client.getRepository<Customer>(Customer);
            const rows = await repo.find({
                filter: [Eq('id', 1)],
                columns: ['id', 'countryCode', 'countryLazy']
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

        it('specify returning columns', async function () {
            const repo = client.getRepository<Customer>(Customer);
            const rows = await repo.find({
                filter: [Eq('id', 1)],
                columns: ['id', 'countryCode', 'countryLazy.continentCode']
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
            x = await rows[0].countryLazy({columns: ['phoneCode']});
            assert.ok(typeof x === 'object');
            assert.ok(!Array.isArray(x));
            assert.deepStrictEqual(x, Object.assign(new Country(), {
                phoneCode: '+1'
            }));
        });

        it('filter by o2o relational column', async function () {
            const repo = client.getRepository<Customer>(Customer);
            const rows = await repo.find({
                columns: ['id', 'countryCode'],
                filter: Eq('countryLazy.continent.code', 'AM')
            });
            for (const row of rows) {
                assert.ok(row.countryCode === 'CA' || row.countryCode === 'US');
            }
        });

    });

    /**
     *
     */
    describe('One-2-Many relation (eager)', function () {

        it('return instances', async function () {
            const repo = client.getRepository<Country>(Country);
            const rows = await repo.find({
                filter: [In('code', ['DE', 'TR'])],
                columns: ['code', 'customers']
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

        it('specify returning columns', async function () {
            const repo = client.getRepository<Country>(Country);
            const rows = await repo.find({
                filter: [In('code', ['DE', 'TR'])],
                columns: ['code', 'customers.givenName']
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

    /**
     *
     */
    describe('One-2-Many relation (lazy)', function () {

        it('one-2-many relation (lazy)', async function () {
            const repo = client.getRepository<Country>(Country);
            const rows = await repo.find({
                filter: [Eq('code', 'DE')],
                columns: ['code', 'customersLazy']
            });
            assert.ok(rows);
            assert.ok(rows.length);
            assert.strictEqual(rows[0].code, 'DE');

            const customers = await rows[0].customersLazy();
            assert.ok(Array.isArray(customers));
            assert.ok(customers.length);
            for (const customer of customers) {
                assert.strictEqual(customer.countryCode, 'DE');
            }
        });

        it('sort one-2-many relation (lazy)', async function () {
            const repo = client.getRepository<Country>(Country);
            const rows = await repo.find({
                filter: [Eq('code', 'DE')],
                columns: ['code', 'customersLazy']
            });
            assert.ok(rows);
            assert.ok(rows.length);
            assert.strictEqual(rows[0].code, 'DE');

            const customers = await rows[0].customersLazy({sort: ['givenName']});
            const arr1 = customers.map(c => c.givenName);
            const arr2 = [...arr1];
            arr2.sort();
            assert.deepStrictEqual(arr1, arr2);
        });

        it('limit one-2-many relation (lazy)', async function () {
            const repo = client.getRepository<Country>(Country);
            const rows = await repo.find({
                filter: [Eq('code', 'DE')],
                columns: ['code', 'customersLazy']
            });
            assert.ok(rows);
            assert.ok(rows.length);
            assert.strictEqual(rows[0].code, 'DE');

            const customers = await rows[0].customersLazy({limit: 2});
            assert.deepStrictEqual(customers.length, 2);
        });

        it('offset one-2-many relation (lazy)', async function () {
            const repo = client.getRepository<Country>(Country);
            const rows = await repo.find({
                filter: [Eq('code', 'DE')],
                columns: ['code', 'customersLazy']
            });
            assert.ok(rows);
            assert.ok(rows.length);
            assert.strictEqual(rows[0].code, 'DE');

            const customers = await rows[0].customersLazy({limit: 2});
            assert.deepStrictEqual(customers.length, 2);
        });

        it('specify returning columns of one-2-many relation (lazy)', async function () {
            const repo = client.getRepository<Country>(Country);
            const rows = await repo.find({
                filter: [Eq('code', 'DE')],
                columns: ['code', 'customersLazy']
            });
            assert.ok(rows);
            assert.ok(rows.length);
            assert.strictEqual(rows[0].code, 'DE');

            const customers = await rows[0].customersLazy({limit: 1, columns: ['givenName']});
            assert.deepStrictEqual(Object.keys(customers[0]), ['givenName']);
        });
    });

});
