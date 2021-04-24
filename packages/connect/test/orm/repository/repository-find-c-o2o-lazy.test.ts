import '../../_support/env';
import assert from 'assert';
import {Eq} from '@sqb/builder';
import {Customer} from '../../_support/customers.entity';
import {initClient} from '../../_support/init-client';
import {Entity, EntityChain, HasOneLazy, LazyResolver, SqbClient} from '@sqb/connect';
import {Country} from '@sqb/connect/test/_support/countries.entity';
import {Continent} from '@sqb/connect/test/_support/continents.entity';

function toJSON(obj: any): any {
    return JSON.parse(JSON.stringify(obj));
}

@Entity({tableName: 'customers'})
class Customer2 extends Customer {
    @HasOneLazy(EntityChain(Country).chain(Continent))
    continentLazy: LazyResolver<Continent>;
}

describe('findAll() Chained One-To-One (C-OtO) lazy', function () {

    let client: SqbClient;
    before(() => client = initClient());
return;
    it('should resolve record async', async function () {
        const repo = client.getRepository(Customer2);
        const rows = await repo.findAll({
            filter: [Eq('id', 1)],
            elements: ['id', 'countryCode', 'continentLazy']
        });
        assert.ok(rows);
        assert.ok(rows.length);
        assert.strictEqual(rows[0].id, 1);
        assert.strictEqual(rows[0].countryCode, 'US');
        const x = await rows[0].continentLazy();
        assert.ok(typeof x === 'object');
        assert.ok(!Array.isArray(x));
        assert.deepStrictEqual(toJSON(x), {
            code: 'AM',
            name: 'America'
        });
    });

    return;
    it('should specify returning columns', async function () {
        const repo = client.getRepository(Customer);
        const rows = await repo.findAll({
            filter: [Eq('id', 1)],
            elements: ['id', 'countryLazy']
        });
        assert.ok(rows);
        assert.ok(rows.length);
        assert.strictEqual(rows[0].id, 1);
        assert.strictEqual(rows[0].countryCode, 'US');
        let x = await rows[0].countryLazy({elements: ['continentCode']});
        assert.ok(typeof x === 'object');
        assert.ok(!Array.isArray(x));
        assert.deepStrictEqual(toJSON(x), {
            continentCode: 'AM'
        });
        x = await rows[0].countryLazy({elements: ['phoneCode']});
        assert.ok(typeof x === 'object');
        assert.ok(!Array.isArray(x));
        assert.deepStrictEqual(toJSON(x), {
            phoneCode: '+1'
        });
    });

    it('should filter by relational column', async function () {
        const repo = client.getRepository(Customer);
        const rows = await repo.findAll({
            elements: ['id', 'countryCode'],
            filter: Eq('countryLazy.continent.code', 'AM')
        });
        for (const row of rows) {
            assert.ok(row.countryCode === 'CA' || row.countryCode === 'US');
        }
    });

});
