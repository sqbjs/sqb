import '../_support/env';
import '@sqb/postgres';
import assert from 'assert';
import {Client} from '@sqb/connect';
import {createTestSchema} from '../../../postgres/test/_support/create-db';
import {Customer} from '../_support/customers.entity';
import {Eq, Gte} from '@sqb/builder';

describe('Repository', function () {

    let client: Client;

    if (process.env.SKIP_CREATE_DB !== 'true') {
        before(async () => {
            this.timeout(30000);
            await createTestSchema();
        })
    }

    before(() => {
        if (!client)
            client = new Client({dialect: 'postgres', defaults: {cursor: true, objectRows: true}});
    });
    after(async () => {
        if (client)
            await client.close(0);
        client = undefined;
    });

    describe('find()', function () {
        it('should return instances', async function () {
            const repo = client.getRepository<Customer>(Customer);
            const rows = await repo.find();
            assert.ok(rows);
            assert.ok(rows.length);
            assert.ok(rows[0].id);
            assert.ok(rows[0].givenName);
            assert.ok(rows[0].familyName);
        });

        it('should apply sorting', async function () {
            const repo = client.getRepository<Customer>(Customer);
            const rows = await repo.find({sort: ['-id']});
            const arr1 = rows.map(x => x.id);
            const arr2 = [...arr1];
            arr2.sort((a, b) => b - a);
            assert.deepStrictEqual(arr1, arr2);
        });

        it('should return maximum number of instances specified in "limit" option', async function () {
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

        it('should return instances started from specified in "offset" option', async function () {
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

        it('should apply filter specified in "filter" option', async function () {
            const repo = client.getRepository<Customer>(Customer);
            const rows = await repo.find({
                sort: ['id'],
                limit: 5,
                filter: [Gte('id', 10)]
            });
            assert.ok(rows);
            assert.strictEqual(rows.length, 5);
            assert.strictEqual(rows[0].id, 10);
            assert.strictEqual(rows[4].id, 14);
        });

        it('should returned instances have only given properties given specified in "columns" option', async function () {
            const repo = client.getRepository<Customer>(Customer);
            const rows = await repo.find({
                limit: 1,
                columns: ['id', 'givenName']
            });
            assert.ok(rows);
            assert.deepStrictEqual(Object.keys(rows[0]), ['id', 'givenName']);
        });

        it('should not allow sorting if not enabled', async function () {
            const repo = client.getRepository<Customer>(Customer);
            return assert.rejects(() =>
                    repo.find({sort: ['countryCode']}),
                /is not allowed/);
        });

        it('should not allow sorting if column is not a data column', async function () {
            const repo = client.getRepository<Customer>(Customer);
            return assert.rejects(() =>
                    repo.find({sort: ['country']}),
                /Can not sort by/);
        });

        it('should return nested object from One2One relation', async function () {
            const repo = client.getRepository<Customer>(Customer);
            const rows = await repo.find({
                filter: [Eq('id', 1)],
                columns: ['id', 'countryCode', 'country']
            });
            assert.ok(rows);
            assert.ok(rows.length);
            assert.strictEqual(rows[0].id, 1);
            assert.strictEqual(rows[0].countryCode, 'US');
            assert.deepStrictEqual(rows[0].country, {
                code: 'US',
                name: 'United States',
                phoneCode: '+1',
                continentCode: 'AM'
            });
        });

        it('should return required columns of nested object from One2One relation', async function () {
            const repo = client.getRepository<Customer>(Customer);
            const rows = await repo.find({
                filter: [Eq('id', 1)],
                columns: ['id', 'countryCode', 'country.code', 'country.phoneCode']
            });
            assert.ok(rows);
            assert.ok(rows.length);
            assert.strictEqual(rows[0].id, 1);
            assert.strictEqual(rows[0].countryCode, 'US');
            assert.deepStrictEqual(rows[0].country, {code: 'US', phoneCode: '+1'});
        });

        it('should return nested of nested object from One2One relation', async function () {
            const repo = client.getRepository<Customer>(Customer);
            const rows = await repo.find({
                filter: [Eq('id', 1)],
                columns: ['id', 'country.code', 'country.continent']
            });
            assert.ok(rows);
            assert.ok(rows.length);
            assert.strictEqual(rows[0].id, 1);
            assert.deepStrictEqual(rows[0].country,
                {
                    code: 'US',
                    continent: {
                        code: 'AM',
                        name: 'America'
                    }
                });
        });

    });

    describe('findOne()', function () {
        it('should return single instance', async function () {
            const repo = client.getRepository<Customer>(Customer);
            const row = await repo.findOne({sort: ['id']});
            assert.ok(row);
            assert.strictEqual(row.id, 1);
        });

        it('should return single instance started from specified in "offset" option', async function () {
            const repo = client.getRepository<Customer>(Customer);
            const row = await repo.findOne({
                sort: ['id'],
                offset: 10
            });
            assert.ok(row);
            assert.strictEqual(row.id, 11);
        });

        it('should returned instances have only given properties given specified in "elements" option', async function () {
            const repo = client.getRepository<Customer>(Customer);
            const row = await repo.findOne({
                columns: ['id', 'givenName']
            });
            assert.ok(row);
            assert.deepStrictEqual(Object.keys(row), ['id', 'givenName']);
        });

    });

    describe('findByPk()', function () {
        it('should return single instance by key field', async function () {
            const repo = client.getRepository<Customer>(Customer);
            const row = await repo.findByPk(1);
            assert.ok(row);
            assert.strictEqual(row.id, 1);
            assert.strictEqual(row.givenName, 'Wynne');
            assert.strictEqual(row.familyName, 'Silva');
        });

        it('should returned instances have only given properties given specified in "elements" option', async function () {
            const repo = client.getRepository<Customer>(Customer);
            const row = await repo.findByPk(1, {
                columns: ['id', 'givenName']
            });
            assert.ok(row);
            assert.strictEqual(row.id, 1);
            assert.strictEqual(row.givenName, 'Wynne');
            assert.deepStrictEqual(Object.keys(row), ['id', 'givenName']);
        });
    });


});
