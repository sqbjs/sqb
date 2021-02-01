import '../../_support/env';
import '@sqb/postgres';
import assert from 'assert';
import {Eq, In, Param} from '@sqb/builder';
import {Customer} from '../../_support/customers.entity';
import {Country} from '../../_support/countries.entity';
import {initClient} from '../../_support/init-client';
import {Continent} from '../../_support/continents.entity';

const client = initClient();

describe('"findAll()" method', function () {

    /**
     *
     */
    describe('Regular', function () {

        it('should return instances', async function () {
            const repo = client.getRepository<Customer>(Customer);
            const rows = await repo.findAll();
            assert.ok(rows);
            assert.ok(rows.length);
            assert.ok(rows[0].id);
            assert.ok(rows[0].givenName);
            assert.ok(rows[0].familyName);
        });

        it('should specify returning columns', async function () {
            const repo = client.getRepository<Customer>(Customer);
            const rows = await repo.findAll({
                limit: 1,
                columns: ['id', 'givenName']
            });
            assert.ok(rows);
            assert.deepStrictEqual(Object.keys(rows[0]), ['id', 'givenName']);
        });

        it('should return only data columns (if no columns specified)', async function () {
            const repo = client.getRepository<Customer>(Customer);
            const rows = await repo.findAll();
            assert.ok(rows);
            assert.ok(rows.length);
            assert.ok(rows[0].id);
            assert.ok(rows[0].givenName);
            assert.strictEqual(rows[0].country, undefined);
        });

        it('should filter with Operator', async function () {
            const repo = client.getRepository<Country>(Country);
            const rows = await repo.findAll({filter: Eq('continentCode', 'AM')});
            assert.strictEqual(rows.length, 2);
            assert.strictEqual(rows[0].code, 'CA');
            assert.strictEqual(rows[1].code, 'US');
        });

        it('should filter with plain object', async function () {
            const repo = client.getRepository<Country>(Country);
            const rows = await repo.findAll({filter: {continentCode: 'AM'}});
            assert.strictEqual(rows.length, 2);
            assert.strictEqual(rows[0].code, 'CA');
            assert.strictEqual(rows[1].code, 'US');
        });

        it('should filter if field name different than property name', async function () {
            const repo = client.getRepository<Customer>(Customer);
            const rows = await repo.findAll({
                filter: {
                    givenName: Param('givenName'),
                    familyName: 'Marsh'
                },
                params: {
                    givenName: 'Belle'
                }
            },);
            assert.strictEqual(rows.length, 1);
            assert.strictEqual(rows[0].id, 3);
        });

        it('should limit result rows', async function () {
            const repo = client.getRepository<Customer>(Customer);
            const rows = await repo.findAll({
                sort: ['id'],
                limit: 5
            });
            assert.ok(rows);
            assert.strictEqual(rows.length, 5);
            assert.strictEqual(rows[0].id, 1);
            assert.strictEqual(rows[4].id, 5);
        });

        it('should start from given offset', async function () {
            const repo = client.getRepository<Customer>(Customer);
            const rows = await repo.findAll({
                sort: ['id'],
                limit: 5,
                offset: 10
            });
            assert.ok(rows);
            assert.strictEqual(rows.length, 5);
            assert.strictEqual(rows[0].id, 11);
            assert.strictEqual(rows[4].id, 15);
        });

        it('should sort result rows', async function () {
            const repo = client.getRepository<Customer>(Customer);
            const rows = await repo.findAll({sort: ['-id']});
            const arr1 = rows.map(x => x.id);
            const arr2 = [...arr1];
            arr2.sort((a, b) => b - a);
            assert.deepStrictEqual(arr1, arr2);
        });

        it('should sort by data columns only ', async function () {
            const repo = client.getRepository<Customer>(Customer);
            return assert.rejects(() =>
                    repo.findAll({sort: ['country']}),
                /Can not sort by/);
        });

        it('should apply transformRead function', async function () {
            const repo = client.getRepository<Customer>(Customer);
            const rows = await repo.findAll({sort: ['id'], limit: 10});
            assert.strictEqual(rows[0].gender, 'Male');
            assert.strictEqual(rows[1].gender, 'Female');
        });

    });

    /**
     *
     */
    describe('One-2-One relation (eager)', function () {

        it('should return related instance', async function () {
            const repo = client.getRepository<Customer>(Customer);
            const rows = await repo.findAll({
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

        it('should return sub o2o related instance', async function () {
            const repo = client.getRepository<Customer>(Customer);
            const rows = await repo.findAll({
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

        it('should filter by o2o relational column', async function () {
            const repo = client.getRepository<Customer>(Customer);
            const rows = await repo.findAll({
                columns: ['id', 'countryCode'],
                filter: Eq('country.continent.code', 'AM')
            });
            for (const row of rows) {
                assert.ok(row.countryCode === 'CA' || row.countryCode === 'US');
            }
        });

        it('should use "exists" when filtering by o2o relational column', async function () {
            const repo = client.getRepository<Customer>(Customer);
            let request: any = {};
            client.once('execute', (req => request = req));
            await repo.findAll({
                columns: ['id'],
                filter: [{'country.continent.code': 'AM'}]
            });
            assert.strictEqual(request.sql, 'select T.ID as T_ID from customers T where ' +
                'exists (select 1 from countries E1 where E1.code = T.country_code and ' +
                'exists (select 1 from continents E2 where E2.code = E1.continent_code and E2.code = $1))');
            assert.deepStrictEqual(request.params, ['AM']);
        });

        it('should specify returning columns', async function () {
            const repo = client.getRepository<Customer>(Customer);
            const rows = await repo.findAll({
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

        it('should return instance async', async function () {
            const repo = client.getRepository<Customer>(Customer);
            const rows = await repo.findAll({
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

        it('should specify returning columns', async function () {
            const repo = client.getRepository<Customer>(Customer);
            const rows = await repo.findAll({
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

        it('should filter by o2o relational column', async function () {
            const repo = client.getRepository<Customer>(Customer);
            const rows = await repo.findAll({
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

        it('should return instances', async function () {
            const repo = client.getRepository<Country>(Country);
            const rows = await repo.findAll({
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

        it('should specify returning columns', async function () {
            const repo = client.getRepository<Country>(Country);
            const rows = await repo.findAll({
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

        it('should resolve one-2-many relation (lazy)', async function () {
            const repo = client.getRepository<Country>(Country);
            const rows = await repo.findAll({
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

        it('should sort one-2-many relation (lazy)', async function () {
            const repo = client.getRepository<Country>(Country);
            const rows = await repo.findAll({
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

        it('should limit one-2-many relation (lazy)', async function () {
            const repo = client.getRepository<Country>(Country);
            const rows = await repo.findAll({
                filter: [Eq('code', 'DE')],
                columns: ['code', 'customersLazy']
            });
            assert.ok(rows);
            assert.ok(rows.length);
            assert.strictEqual(rows[0].code, 'DE');

            const customers = await rows[0].customersLazy({limit: 2});
            assert.deepStrictEqual(customers.length, 2);
        });

        it('should offset one-2-many relation (lazy)', async function () {
            const repo = client.getRepository<Country>(Country);
            const rows = await repo.findAll({
                filter: [Eq('code', 'DE')],
                columns: ['code', 'customersLazy']
            });
            assert.ok(rows);
            assert.ok(rows.length);
            assert.strictEqual(rows[0].code, 'DE');

            const customers = await rows[0].customersLazy({limit: 2});
            assert.deepStrictEqual(customers.length, 2);
        });

        it('should specify returning columns of one-2-many relation (lazy)', async function () {
            const repo = client.getRepository<Country>(Country);
            const rows = await repo.findAll({
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
