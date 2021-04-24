import '../../_support/env';
import assert from 'assert';
import {Eq} from '@sqb/builder';
import {SqbClient} from '@sqb/connect';
import {Customer} from '../../_support/customers.entity';
import {initClient} from '../../_support/init-client';

function toJSON(obj: any): any {
    return JSON.parse(JSON.stringify(obj));
}

describe('findAll() One-to-One eager', function () {

    let client: SqbClient;
    before(() => client = initClient());

    it('should return related instance', async function () {
        const repo = client.getRepository(Customer);
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
            phoneCode: '+1',
            continentCode: 'AM'
        });
    });

    it('should return only requested sub elements', async function () {
        const repo = client.getRepository(Customer);
        const rows = await repo.findAll({
            filter: [Eq('id', 1)],
            elements: ['id', 'country.code', 'country.continent']
        });
        assert.ok(rows);
        assert.ok(rows.length);
        assert.strictEqual(rows[0].id, 1);
        assert.deepStrictEqual(toJSON(rows[0].country), {
            code: 'US',
            continent: {
                code: 'AM',
                name: 'America'
            }
        });
    });

    it('should filter by relation column', async function () {
        const repo = client.getRepository(Customer);
        const rows = await repo.findAll({
            elements: ['id', 'countryCode'],
            filter: Eq('country.continent.code', 'AM')
        });
        for (const row of rows) {
            assert.ok(row.countryCode === 'CA' || row.countryCode === 'US');
        }
    });

    it('should use "exists" when filtering by relation column', async function () {
        const repo = client.getRepository(Customer);
        let request: any = {};
        client.once('execute', (req => request = req));
        await repo.findAll({
            elements: ['id'],
            filter: [{'country.continent.code': 'AM'}]
        });
        assert.strictEqual(request.sql, 'select T.ID as T_ID from customers T where ' +
            'exists (select 1 from countries E1 where E1.code = T.country_code and ' +
            'exists (select 1 from continents E2 where E2.code = E1.continent_code and E2.code = $1))');
        assert.deepStrictEqual(request.params, ['AM']);
    });

    it('should order by o2o relation column', async function () {
        const repo = client.getRepository(Customer);
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

});
