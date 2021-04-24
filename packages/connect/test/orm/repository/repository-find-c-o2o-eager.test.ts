import '../../_support/env';
import assert from 'assert';
import {Eq} from '@sqb/builder';
import {Entity, HasOne, EntityChain, SqbClient} from '@sqb/connect';
import {initClient} from '../../_support/init-client';
import {Continent} from '../../_support/continents.entity';
import {Country} from '../../_support/countries.entity';
import {Customer} from '../../_support/customers.entity';

function toJSON(obj: any): any {
    return JSON.parse(JSON.stringify(obj));
}

@Entity({tableName: 'customers'})
class Customer2 extends Customer {
    @HasOne(EntityChain(Country).chain(Continent))
    continent: Continent;
}

describe('findAll() Chained One-to-One (C-OtO) eager', function () {

    let client: SqbClient;
    before(() => client = initClient());

    it('should return related instance', async function () {
        const repo = client.getRepository(Customer2);
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

    it('should return only requested sub elements', async function () {
        const repo = client.getRepository(Customer2);
        const rows = await repo.findAll({
            filter: [Eq('id', 1)],
            elements: ['id', 'continent.code']
        });
        assert.ok(rows);
        assert.ok(rows.length);
        assert.strictEqual(rows[0].id, 1);
        assert.deepStrictEqual(toJSON(rows[0].continent), {
            code: 'AM',
        });
    });

    it('should filter by relation column', async function () {
        const repo = client.getRepository(Customer2);
        const rows = await repo.findAll({
            elements: ['id', 'countryCode'],
            filter: Eq('continent.code', 'AM')
        });
        for (const row of rows) {
            assert.ok(row.countryCode === 'CA' || row.countryCode === 'US');
        }
    });

    it('should order by relation column', async function () {
        const repo = client.getRepository(Customer2);
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

});
