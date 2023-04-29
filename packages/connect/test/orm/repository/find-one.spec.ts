/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {SqbClient} from '@sqb/connect';
import {Country} from '../../_support/country.entity.js';
import {Customer} from '../../_support/customer.entity.js';
import {CustomerTag} from '../../_support/customer-tag.entity.js';
import {initClient} from '../../_support/init-client.js';

describe('Repository / findOne()', function () {

    let client: SqbClient;

    beforeAll(async () => {
        client = await initClient();
    })

    afterAll(async () => {
        await client.close(0);
    });

    it('should return single instance', async function () {
        const repo = client.getRepository<Customer>(Customer);
        const row = await repo.findOne({sort: ['id']});
        expect(row).toBeDefined();
        expect(row!.id).toStrictEqual(1);
    });

    it('should return single instance from given offset', async function () {
        const repo = client.getRepository<Customer>(Customer);
        const row = await repo.findOne({
            sort: ['id'],
            offset: 10
        });
        expect(row).toBeDefined();
        expect(row!.id).toStrictEqual(11);
    });

});


describe('Repository / findByPk()', function () {

    let client: SqbClient;

    beforeAll(async () => {
        client = await initClient();
    })

    afterAll(async () => {
        await client.close(0);
    });

    it('should return single instance by key value', async function () {
        const repo = client.getRepository<Country>(Country);
        const row = await repo.findByPk('TR');
        expect(row).toBeDefined();
        expect(row!.code).toStrictEqual('TR');
        expect(row!.name).toStrictEqual('Turkey');
    });

    it('should return single instance by object instance', async function () {
        const repo = client.getRepository<Country>(Country);
        const row = await repo.findByPk({code: 'TR'});
        expect(row).toBeDefined();
        expect(row!.code).toStrictEqual('TR');
        expect(row!.name).toStrictEqual('Turkey');
    });

    it('should return instance from multi-key entities', async function () {
        const repo = client.getRepository<CustomerTag>(CustomerTag);
        const row = await repo.findByPk({customerId: 1, tagId: 1});
        expect(row).toBeDefined();
        expect(row!.customerId).toStrictEqual(1);
        expect(row!.tagId).toStrictEqual(1);
    });

});
