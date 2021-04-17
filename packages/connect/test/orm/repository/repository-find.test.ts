import '../../_support/env';
import '@sqb/postgres';
import assert from 'assert';
import {EntityMeta} from '@sqb/connect';
import {Eq, Param} from '@sqb/builder';
import {Customer} from '../../_support/customers.entity';
import {Country} from '../../_support/countries.entity';
import {initClient} from '../../_support/init-client';

describe('findAll()', function () {

    const client = initClient()

    it('should return only data columns if "elements" option is null', async function () {
        const repo = client.getRepository(Customer);
        const rows = await repo.findAll({limit: 1});
        assert.ok(rows);
        assert.ok(rows.length);
        assert.ok(rows[0].id);
        assert.ok(rows[0].givenName);
        assert.ok(rows[0].familyName);
        assert.strictEqual(rows[0].country, undefined);
    });

    it('should return embedded elements', async function () {
        const repo = client.getRepository(Customer);
        const rows = await repo.findAll({limit: 1});
        assert.ok(rows);
        assert.ok(rows.length);
        assert.ok(rows[0].name);
        assert.ok(rows[0].name.given);
        assert.ok(rows[0].name.family);
    });

    it('should return embedded sub elements', async function () {
        const repo = client.getRepository(Customer);
        const rows = await repo.findAll({limit: 1, elements: ['name.given']});
        assert.ok(rows);
        assert.ok(rows.length);
        assert.ok(rows[0].name);
        assert.deepStrictEqual(Object.keys(rows[0].name), ['given']);
    });

    it('should return requested elements if "elements" option set', async function () {
        const repo = client.getRepository(Customer);
        const rows = await repo.findAll({
            limit: 1,
            elements: ['id', 'givenName']
        });
        assert.ok(rows);
        assert.deepStrictEqual(Object.keys(rows[0]), ['id', 'givenName']);
    });

    it('should return data columns plus elements specified in "include" option', async function () {
        const repo = client.getRepository<Customer>(Customer);
        const rows = await repo.findAll({
            limit: 1,
            include: ['country']
        });
        assert.ok(rows);
        assert.ok(rows[0].givenName);
        assert.ok(rows[0].familyName);
        assert.ok(rows[0].country);
    });

    it('should exclude returning elements specified in "exclude" option', async function () {
        const repo = client.getRepository<Customer>(Customer);
        const rows = await repo.findAll({
            limit: 1,
            include: ['country'],
            exclude: ['familyName', 'country.code']
        });
        assert.ok(rows);
        assert.ok(rows[0].givenName);
        assert.strictEqual(rows[0].familyName, undefined);
        assert.strictEqual(typeof rows[0].country, 'object');
        assert.strictEqual(rows[0].country.code, undefined);
        assert.ok(rows[0].country.name);
    });

    it('should exclude hidden elements', async function () {
        const repo = client.getRepository(Country);
        let rows = await repo.findAll({limit: 1});
        assert.ok(rows);
        assert.ok(rows[0].phoneCode);
        const col = EntityMeta.get(Country).getDataColumn('phoneCode');
        col.hidden = true;
        rows = await repo.findAll({limit: 1});
        assert.ok(rows);
        assert.ok(!rows[0].phoneCode);
        delete col.hidden;
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
        });
        assert.strictEqual(rows.length, 1);
        assert.strictEqual(rows[0].id, 3);
    });

    it('should filter by embedded sub element', async function () {
        const repo = client.getRepository<Customer>(Customer);
        const rows = await repo.findAll({
            filter: {
                'name.given': Param('givenName'),
                'name.family': 'Marsh'
            },
            params: {
                givenName: 'Belle'
            }
        });
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

    it('should sort by embedded sub element', async function () {
        const repo = client.getRepository<Customer>(Customer);
        const rows = await repo.findAll({sort: ['name.given', 'name.family']});
        const arr1 = rows.map(x => x.name.given);
        const arr2 = [...arr1];
        arr2.sort((a, b) => {
            if (a.toLowerCase() < b.toLowerCase())
                return -1
            if (a.toLowerCase() > b.toLowerCase())
                return 1
            return 0;
        });
        assert.deepStrictEqual(arr1, arr2);
    });

    it('should apply "parse"', async function () {
        const repo = client.getRepository<Customer>(Customer);
        const rows = await repo.findAll({sort: ['id'], limit: 10});
        assert.strictEqual(rows[0].gender, 'Male');
        assert.strictEqual(rows[1].gender, 'Female');
    });

});
