import '../../_support/env';
import assert from 'assert';
import {Eq} from '@sqb/builder';
import {initClient} from '../../_support/init-client';
import {CustomerDetails} from '../../_support/customer_details.entity';

function toJSON(obj: any): any {
    return JSON.parse(JSON.stringify(obj));
}

describe('findAll() one-to-one (belongsTo) associations', function () {

    const client = initClient();

    it('should return associated instance', async function () {
        const repo = client().getRepository(CustomerDetails);
        const rows = await repo.findAll({
            filter: [Eq('customerId', 1)],
            elements: ['id', 'customer']
        });
        assert.ok(rows);
        assert.ok(rows.length);
        assert.ok(rows[0].customer);
        assert.strictEqual(rows[0].customer.id, 1);
    });

    it('should return multi level associated instances', async function () {
        const repo = client().getRepository(CustomerDetails);
        const rows = await repo.findAll({
            filter: [Eq('customerId', 1)],
            elements: ['customerId', 'customer.country']
        });
        assert.ok(rows);
        assert.ok(rows.length);
        assert.strictEqual(rows[0].customerId, 1);
        assert.deepStrictEqual(toJSON(rows[0].customer), {
            country: {
                code: 'US',
                continentCode: 'AM',
                name: 'United States',
                phoneCode: '+1'
            }
        });
    });

    it('should return only requested sub elements', async function () {
        const repo = client().getRepository(CustomerDetails);
        const rows = await repo.findAll({
            filter: [Eq('customerId', 1)],
            elements: ['customerId', 'customer.id']
        });
        assert.ok(rows);
        assert.ok(rows.length);
        assert.strictEqual(rows[0].customerId, 1);
        assert.deepStrictEqual(toJSON(rows[0].customer), {
            id: 1
        });
    });

    it('should filter by associated column', async function () {
        const repo = client().getRepository(CustomerDetails);
        const rows = await repo.findAll({
            elements: ['customerId', 'countryCode'],
            filter: Eq('customer.countryCode', 'GB')
        });
        for (const row of rows) {
            assert.ok(row.customer.countryCode === 'GB');
        }
    });

    it('should order by associated column', async function () {
        const repo = client().getRepository(CustomerDetails);
        const rows = await repo.findAll({
            elements: ['customerId', 'customer.givenName'],
            sort: ['customer.givenName']
        });
        assert.ok(rows);
        assert.ok(rows.length);
        const left = rows.map(x => x.customer.givenName);
        const sorted = [...left]
        sorted.sort();
        assert.deepStrictEqual(left, sorted);
    });

});
