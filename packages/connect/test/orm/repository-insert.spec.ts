import '../_support/env';
import '@sqb/postgres';
import assert from 'assert';
import {Eq} from '@sqb/builder';
import {Customer} from '../_support/customers.entity';
import {Country} from '../_support/countries.entity';
import {initClient} from '../_support/init-client';

describe('Repository insert operations', function () {

    const client = initClient();

    /**
     *
     */
    describe('insert()', function () {

        it('return insert instance', async function () {
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


});
