import assert from 'assert';
import '../../_support/env';
import {Customer} from '../../_support/customer.entity';
import {initClient} from '../../_support/init-client';
import {Tag} from '../../_support/tags.entity';

describe('create()', function () {

    const client = initClient();

    it('should insert new record and return new values', async function () {
        const values = {
            givenName: 'G' + Math.trunc(Math.random() * 10000),
            familyName: 'F' + Math.trunc(Math.random() * 10000),
            countryCode: 'TR'
        }
        const repo = client().getRepository(Customer);
        const c = await repo.count();
        const customer = await repo.create(values);
        assert.ok(customer);
        assert.ok(customer instanceof Customer);
        assert.ok(customer.id);
        assert.ok(customer.id > 0);
        assert.strictEqual(customer.givenName, values.givenName);
        assert.strictEqual(customer.familyName, values.familyName);
        assert.strictEqual(customer.countryCode, values.countryCode);
        const x = await repo.findByPk(customer, {
            elements: ['id', 'givenName', 'familyName', 'countryCode', 'country']
        });
        const c2 = await repo.count();
        assert.ok(x);
        assert.strictEqual(c2, c + 1);
        assert.strictEqual(x.id, customer.id);
        assert.strictEqual(x.givenName, values.givenName);
        assert.strictEqual(x.familyName, values.familyName);
        assert.strictEqual(x.countryCode, values.countryCode);
        assert.strictEqual(x.country.code, values.countryCode);
    });

    it('should apply column.serialize() before insert', async function () {
        const values = {
            givenName: 'G' + Math.trunc(Math.random() * 10000),
            familyName: 'F' + Math.trunc(Math.random() * 10000),
            countryCode: 'TR',
            gender: 'Male'
        }
        const repo = client().getRepository<Customer>(Customer);
        const customer = await repo.create(values);
        assert.ok(customer);
        const x = await repo.findByPk(customer, {elements: ['id', 'gender']});
        assert.ok(x);
        assert.strictEqual(x.id, customer.id);
        assert.strictEqual(x.gender, 'Male');
    });

    it('should map embedded elements into fields', async function () {
        const values = {
            name: {
                given: 'G' + Math.trunc(Math.random() * 10000),
                family: 'F' + Math.trunc(Math.random() * 10000),
            },
            countryCode: 'TR'
        }
        const repo = client().getRepository(Customer);
        const c = await repo.count();
        const customer = await repo.create(values);
        assert.ok(customer);
        assert.ok(customer instanceof Customer);
        assert.ok(customer.id);
        assert.ok(customer.id > 0);
        assert.deepStrictEqual({...customer.name}, values.name);
        const x = await repo.findByPk(customer, {
            elements: ['id', 'name']
        });
        const c2 = await repo.count();
        assert.ok(x);
        assert.strictEqual(c2, c + 1);
        assert.strictEqual(x.id, customer.id);
        assert.deepStrictEqual({...x.name}, values.name);
    });

    it('should set default value', async function () {
        const values = {
            name: {
                given: 'G' + Math.trunc(Math.random() * 10000),
                family: 'F' + Math.trunc(Math.random() * 10000),
            },
            countryCode: 'TR'
        }
        const repo = client().getRepository(Customer);
        const customer = await repo.create(values);
        assert.ok(customer);
        assert.strictEqual(customer.active, true);
    });

    it('should check enum value', async function () {
        const repo = client().getRepository(Tag);
        await assert.rejects(() => repo.create({name: 'small', color: 'pink'}),
            /value must be one of/);
    });

    it('should column is required', async function () {
        const repo = client().getRepository(Customer);
        await assert.rejects(() => repo.create({givenName: 'aa', familyName: 'bb'}),
            /is required/);
    });

    it('should execute in transaction', async function () {
        let c = 0;
        return client().acquire(async (connection) => {
            const values = {
                givenName: 'Abc',
                familyName: 'Def',
                countryCode: 'DE'
            };
            const repo = connection.getRepository<Customer>(Customer);
            c = await repo.count();
            await connection.startTransaction();
            await repo.create(values);
            let c2 = await repo.count();
            assert.strictEqual(c2, c + 1);
            await connection.rollback();
            c2 = await repo.count();
            assert.strictEqual(c2, c);
        });
    });

});

describe('createOnly()', function () {

    const client = initClient();

    it('should not generate "returning" sql query for fast execution', async function () {
        return client().acquire(async (connection) => {
            const values = {
                givenName: 'Abc',
                familyName: 'Def',
                countryCode: 'DE'
            };
            const repo = connection.getRepository(Customer);
            let sql = '';
            connection.on('execute', req => {
                sql = req.sql;
            });
            await repo.createOnly(values);
            assert.ok(!sql.includes('returning'));
        });
    });

});
