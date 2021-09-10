import '../../_support/env';
import assert from 'assert';
import {Eq} from '@sqb/builder';
import {Customer} from '../../_support/customer.entity';
import {initClient} from '../../_support/init-client';

function toJSON(obj: any): any {
    return obj ? JSON.parse(JSON.stringify(obj)) : undefined;
}

describe('find() one to one relations', function () {

    const client = initClient();

    describe('linkToOne', function () {

        it('return associated row as object property', async function () {
            const repo = client().getRepository(Customer);
            const rows = await repo.findAll({
                filter: [Eq('id', 1)],
                elements: ['id', 'countryCode', 'country']
            });
            assert.ok(rows);
            assert.ok(rows.length);
            assert.strictEqual(rows[0].id, 1);
            assert.strictEqual(rows[0].countryCode, 'US');
            assert.deepStrictEqual(toJSON(rows[0].country), {
                code: 'US',
                name: 'United States',
                hasMarket: true,
                phoneCode: '+1',
                continentCode: 'AM'
            });
        });

        it('dont return associated if not explicitly requested', async function () {
            const repo = client().getRepository(Customer);
            const rows = await repo.findAll({
                filter: [Eq('id', 1)]
            });
            assert.ok(rows);
            assert.ok(rows.length);
            assert.strictEqual(rows[0].id, 1);
            assert.deepStrictEqual(rows[0].country, undefined);
        });

        it('query sub associations', async function () {
            const repo = client().getRepository(Customer);
            const rows = await repo.findAll({
                filter: [Eq('id', 1)],
                elements: ['id', 'country.continent']
            });
            assert.ok(rows);
            assert.ok(rows.length);
            assert.strictEqual(rows[0].id, 1);
            assert.deepStrictEqual(toJSON(rows[0].country), {
                continent: {
                    code: 'AM',
                    name: 'America'
                }
            });
        });

        it('query sub associations (include)', async function () {
            const repo = client().getRepository(Customer);
            const rows = await repo.findAll({
                filter: [Eq('id', 1)],
                elements: ['id'],
                include: ['country.continent']
            });
            assert.ok(rows);
            assert.ok(rows.length);
            assert.strictEqual(rows[0].id, 1);
            assert.deepStrictEqual(toJSON(rows[0].country), {
                continent: {
                    code: 'AM',
                    name: 'America'
                }
            });
        });

        it('choice which elements will be returned by server', async function () {
            const repo = client().getRepository(Customer);
            const rows = await repo.findAll({
                filter: [Eq('id', 1)],
                elements: ['id', 'country.code', 'country.continent.code']
            });
            assert.ok(rows);
            assert.ok(rows.length);
            assert.strictEqual(rows[0].id, 1);
            assert.deepStrictEqual(toJSON(rows[0].country), {
                code: 'US',
                continent: {
                    code: 'AM'
                }
            });
        });

        it('filter results by associated element', async function () {
            const repo = client().getRepository(Customer);
            const rows = await repo.findAll({
                elements: ['id', 'countryCode'],
                filter: Eq('country.continent.code', 'AM')
            });
            for (const row of rows) {
                assert.ok(row.countryCode === 'CA' || row.countryCode === 'US');
            }
        });

        it('use "exists" when filtering by associated element', async function () {
            const repo = client().getRepository(Customer);
            let request: any = {};
            client().once('execute', (req => request = req));
            await repo.findAll({
                elements: ['id'],
                filter: [{'country.continent.code': 'AM'}]
            });
            assert.ok(request.sql.includes('exists'));
            assert.deepStrictEqual(request.params, ['AM']);
        });

        it('order by associated element', async function () {
            const repo = client().getRepository(Customer);
            const rows = await repo.findAll({
                elements: ['id', 'countryCode', 'country.code', 'country.phoneCode'],
                sort: ['country.code']
            });
            assert.ok(rows);
            assert.ok(rows.length);
            const left = rows.map(x => x.country.code);
            const sorted = [...left]
            sorted.sort();
            assert.deepStrictEqual(left, sorted);
        });
    })

    describe('linkFromOne', function () {

        it('return associated row as object property', async function () {
            const repo = client().getRepository(Customer);
            const rows = await repo.findAll({
                filter: [Eq('id', 1)],
                elements: ['id', 'details']
            });
            assert.ok(rows);
            assert.ok(rows.length);
            assert.ok(rows[0].details);
            assert.strictEqual(rows[0].details.customerId, 1);
        });

        it('choice which elements will be returned by server', async function () {
            const repo = client().getRepository(Customer);
            const rows = await repo.findAll({
                filter: [Eq('id', 1)],
                elements: ['id', 'details.notes']
            });
            assert.ok(rows);
            assert.ok(rows.length);
            assert.deepStrictEqual(Object.keys(rows[0].details), ['notes']);
        });

        it('filter results by associated element', async function () {
            const repo = client().getRepository(Customer);
            const rows = await repo.findAll({
                elements: ['id', 'details'],
                filter: Eq('details.customerId', 1)
            });
            assert.strictEqual(rows.length, 1);
            assert.strictEqual(rows[0].id, 1);
            assert.strictEqual(rows[0].details.customerId, 1);
        });

        it('order by associated element', async function () {
            const repo = client().getRepository(Customer);
            const rows = await repo.findAll({
                elements: ['id', 'details.notes'],
                sort: ['details.notes']
            });
            assert.ok(rows);
            assert.ok(rows.length);
            const left = rows.map(x => x.details ? x.details.notes : undefined);
            const sorted = [...left]
            sorted.sort();
            assert.deepStrictEqual(left, sorted);
        });
    })

    describe('Association chain', function () {

        it('return row of last association in the chain as object property', async function () {
            const repo = client().getRepository(Customer);
            const rows = await repo.findAll({
                filter: [Eq('id', 1)],
                elements: ['id', 'countryCode', 'country']
            });
            assert.ok(rows);
            assert.ok(rows.length);
            assert.strictEqual(rows[0].id, 1);
            assert.strictEqual(rows[0].countryCode, 'US');
            assert.deepStrictEqual(toJSON(rows[0].country), {
                code: 'US',
                name: 'United States',
                hasMarket: true,
                phoneCode: '+1',
                continentCode: 'AM'
            });
        });

        it('query sub associations', async function () {
            const repo = client().getRepository(Customer);
            const rows = await repo.findAll({
                filter: [Eq('id', 1)],
                elements: ['id', 'country.continent']
            });
            assert.ok(rows);
            assert.ok(rows.length);
            assert.strictEqual(rows[0].id, 1);
            assert.deepStrictEqual(toJSON(rows[0].country), {
                continent: {
                    code: 'AM',
                    name: 'America'
                }
            });
        });

        it('choice which elements will be returned by server', async function () {
            const repo = client().getRepository(Customer);
            const rows = await repo.findAll({
                filter: [Eq('id', 1)],
                elements: ['id', 'country.code', 'country.continent.code']
            });
            assert.ok(rows);
            assert.ok(rows.length);
            assert.strictEqual(rows[0].id, 1);
            assert.deepStrictEqual(toJSON(rows[0].country), {
                code: 'US',
                continent: {
                    code: 'AM'
                }
            });
        });

        it('filter by associated element', async function () {
            const repo = client().getRepository(Customer);
            const rows = await repo.findAll({
                elements: ['id', 'countryCode'],
                filter: Eq('country.continent.code', 'AM')
            });
            for (const row of rows) {
                assert.ok(row.countryCode === 'CA' || row.countryCode === 'US');
            }
        });

        it('use "exists" when filtering by associated element', async function () {
            const repo = client().getRepository(Customer);
            let request: any = {};
            client().once('execute', (req => request = req));
            await repo.findAll({
                elements: ['id'],
                filter: [{'country.continent.code': 'AM'}]
            });
            assert.ok(request.sql.includes('exists'));
            assert.deepStrictEqual(request.params, ['AM']);
        });

        it('order by associated element', async function () {
            const repo = client().getRepository(Customer);
            const rows = await repo.findAll({
                elements: ['id', 'countryCode', 'country.code', 'country.phoneCode'],
                sort: ['country.code']
            });
            assert.ok(rows);
            assert.ok(rows.length);
            const left = rows.map(x => x.country.code);
            const sorted = [...left]
            sorted.sort();
            assert.deepStrictEqual(left, sorted);
        });

        it('query indirect associations', async function () {
            const repo = client().getRepository(Customer);
            const rows = await repo.findAll({
                filter: [Eq('id', 1)],
                elements: ['id', 'continent']
            });
            assert.ok(rows);
            assert.ok(rows.length);
            assert.strictEqual(rows[0].id, 1);
            assert.deepStrictEqual(toJSON(rows[0].continent), {
                code: 'AM',
                name: 'America'
            });
        });

        it('order by indirect associated elements', async function () {
            const repo = client().getRepository(Customer);
            const rows = await repo.findAll({
                elements: ['id', 'countryCode', 'country.continentCode'],
                sort: ['continent.code']
            });
            assert.ok(rows);
            assert.ok(rows.length);
            const left = rows.map(x => x.country.code);
            const sorted = [...left]
            sorted.sort();
            assert.deepStrictEqual(left, sorted);
        });

        it('associations with target conditions', async function () {
            const repo = client().getRepository(Customer);
            const rows = await repo.findAll({
                elements: ['id', 'vvipDetails']
            });
            assert.ok(rows);
            assert.ok(rows.length);
            const a = rows.filter(x => x.vvipDetails);
            assert.ok(a.length > 0);
            for (const customer of rows) {
                if (customer.vvipDetails)
                    assert.ok(customer.vvipDetails.rank >= 5, customer.vvipDetails.rank + '!=5');
            }
        });


    })

});
