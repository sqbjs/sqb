/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {Eq, Param} from '@sqb/builder';
import {Entity, SqbClient} from '@sqb/connect';
import {Country} from '../../_support/country.entity.js';
import {Customer} from '../../_support/customer.entity.js';
import {initClient} from '../../_support/init-client.js';

describe('Repository / findMany()', function () {

    let client: SqbClient;

    beforeAll(async () => {
        client = await initClient();
    })

    afterAll(async () => {
        await client.close(0);
    });

    it('should return only non exclusive if "pick" option is null', async function () {
        const repo = client.getRepository(Customer);
        const rows = await repo.findMany({limit: 1});
        expect(rows).toBeDefined();
        expect(rows.length).toBeGreaterThan(0);
        expect(rows[0].id).toBeDefined();
        expect(rows[0].givenName).toBeDefined();
        expect(rows[0].familyName).toBeDefined();
        expect(rows[0].country).toBeUndefined();
        expect(rows[0].birthDate).toBeUndefined();
    });

    it('should return embedded fields', async function () {
        const repo = client.getRepository(Customer);
        const rows = await repo.findMany({limit: 1});
        expect(rows).toBeDefined();
        expect(rows.length).toBeGreaterThan(0);
        expect(rows[0].name).toBeDefined();
        expect(rows[0].name!.given).toBeDefined();
        expect(rows[0].name!.family).toBeDefined();
    });

    it('should return embedded fields with prefix', async function () {
        const repo = client.getRepository(Customer);
        const rows = await repo.findMany({filter: {id: 1}});
        expect(rows).toBeDefined();
        expect(rows.length).toBeGreaterThan(0);
        expect(rows[0].address).toBeDefined();
        expect(rows[0].address!.city).toBeDefined();
        expect(rows[0].address!.street).toBeDefined();
    });

    it('should return embedded sub fields', async function () {
        const repo = client.getRepository(Customer);
        const rows = await repo.findMany({limit: 1, pick: ['name.given']});
        expect(rows).toBeDefined();
        expect(rows.length).toBeGreaterThan(0);
        expect(rows[0].name).toBeDefined();
        expect(Object.keys(rows[0].name!)).toStrictEqual(['given']);
    });

    it('should return json field as embedded element', async function () {
        const repo = client.getRepository(Customer);
        const row = await repo.findByPk(1, {pick: ['customData']});
        expect(row).toBeDefined();
        expect(row!.customData).toBeDefined();
        expect(typeof row!.customData).toStrictEqual('object');
    });

    it('should return requested fields if "pick" option set', async function () {
        const repo = client.getRepository(Customer);
        const rows = await repo.findMany({
            limit: 1,
            pick: ['id', 'givenName']
        });
        expect(rows).toBeDefined();
        expect(Object.keys(rows[0])).toStrictEqual(['id', 'givenName']);
    });

    it('should return data columns plus elements specified in "include" option', async function () {
        const repo = client.getRepository(Customer);
        const rows = await repo.findMany({
            limit: 1,
            include: ['birthDate']
        });
        expect(rows).toBeDefined();
        expect(rows[0].givenName).toBeDefined();
        expect(rows[0].familyName).toBeDefined();
        expect(rows[0].birthDate).toBeDefined();
    });

    it('should exclude exclusive fields if not included', async function () {
        const repo = client.getRepository(Customer);
        const rows = await repo.findMany({limit: 1});
        expect(rows).toBeDefined();
        expect(rows.length).toBeGreaterThan(0);
        expect(rows[0].country).toBeUndefined();
    });

    it('should exclude result fields', async function () {
        const repo = client.getRepository(Customer);
        const rows = await repo.findMany({
            limit: 1,
            include: ['country'],
            omit: ['familyName', 'country.code']
        });
        expect(rows).toBeDefined();
        expect(rows[0].givenName).toBeDefined();
        expect(rows[0].familyName).toBeUndefined();
        expect(typeof rows[0].country).toStrictEqual('object');
        expect(rows[0].country!.code).toBeUndefined();
        expect(rows[0].country!.name).toBeDefined();
    });

    it('should exclude hidden elements', async function () {
        const repo = client.getRepository(Country);
        let rows = await repo.findMany({limit: 1});
        expect(rows).toBeDefined();
        expect(rows[0].phoneCode).toBeDefined();
        const col = Entity.getColumnField(Country, 'phoneCode');
        col!.hidden = true;
        rows = await repo.findMany({limit: 1});
        expect(rows).toBeDefined();
        expect(rows[0].phoneCode).toBeUndefined();
        delete col!.hidden;
    });

    it('should filter with Operator', async function () {
        const repo = client.getRepository<Country>(Country);
        const rows = await repo.findMany({filter: Eq('continentCode', 'AM')});
        expect(rows.length).toStrictEqual(2);
        expect(rows[0].code).toStrictEqual('CA');
        expect(rows[1].code).toStrictEqual('US');
    });

    it('should filter with plain object', async function () {
        const repo = client.getRepository<Country>(Country);
        const rows = await repo.findMany({filter: {continentCode: 'AM'}});
        expect(rows.length).toStrictEqual(2);
        expect(rows[0].code).toStrictEqual('CA');
        expect(rows[1].code).toStrictEqual('US');
    });

    it('should filter if field name different than property name', async function () {
        const repo = client.getRepository(Customer);
        const rows = await repo.findMany({
            filter: {
                givenName: Param('givenName'),
                familyName: 'Marsh'
            },
            params: {
                givenName: 'Belle'
            }
        });
        expect(rows.length).toStrictEqual(1);
        expect(rows[0].id).toStrictEqual(3);
    });

    it('should filter by embedded sub element', async function () {
        const repo = client.getRepository(Customer);
        const rows = await repo.findMany({
            filter: {
                'address.city': Param('city')
            },
            params: {
                city: 'Dallas'
            }
        });
        for (const row of rows) {
            expect(row.address).toBeDefined();
            expect(row.address!.city).toStrictEqual('Dallas');
        }
    });

    it('should limit result rows', async function () {
        const repo = client.getRepository(Customer);
        const rows = await repo.findMany({
            sort: ['id'],
            limit: 5
        });
        expect(rows).toBeDefined();
        expect(rows.length).toStrictEqual(5);
        expect(rows[0].id).toStrictEqual(1);
        expect(rows[4].id).toStrictEqual(5);
    });

    it('should start from given offset', async function () {
        const repo = client.getRepository(Customer);
        const rows = await repo.findMany({
            sort: ['id'],
            limit: 5,
            offset: 10
        });
        expect(rows).toBeDefined();
        expect(rows.length).toStrictEqual(5);
        expect(rows[0].id).toStrictEqual(11);
        expect(rows[4].id).toStrictEqual(15);
    });

    it('should sort result rows', async function () {
        const repo = client.getRepository(Customer);
        const rows = await repo.findMany({sort: ['-id']});
        const arr1 = rows.map(x => x.id);
        const arr2 = [...arr1];
        arr2.sort((a, b) => b! - a!);
        expect(arr1).toStrictEqual(arr2);
    });

    it('should sort by data columns only ', async function () {
        const repo = client.getRepository(Customer);
        return expect(() =>
            repo.findMany({sort: ['country']})
        ).rejects.toThrow('Can not sort by');
    });

    it('should sort by embedded sub element', async function () {
        const repo = client.getRepository(Customer);
        const rows = await repo.findMany({sort: ['name.given', 'name.family']});
        const arr1 = rows.map(x => x.name!.given);
        const arr2 = [...arr1];
        arr2.sort((a, b) => {
            if (a!.toLowerCase() < b!.toLowerCase())
                return -1
            if (a!.toLowerCase() > b!.toLowerCase())
                return 1
            return 0;
        });
        expect(arr1).toStrictEqual(arr2);
    });

    it('should return distinct results', async function () {
        const repo = client.getRepository(Customer);
        const rows = await repo.findMany({
            pick: ['countryCode'],
            distinct: true
        });
        expect(rows).toBeDefined();
        const a = rows.map(customer => customer.countryCode);
        // Create distinct array
        const b = a.filter((v, i, arr) => arr.indexOf(v) === i);
        expect(a).toStrictEqual(b);
    });

    it('should apply "parse"', async function () {
        const repo = client.getRepository(Customer);
        const rows = await repo.findMany({sort: ['id'], limit: 10});
        expect(rows[0].gender).toStrictEqual('Male');
        expect(rows[1].gender).toStrictEqual('Female');
    });

});
