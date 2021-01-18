import '../../_support/env';
import '@sqb/postgres';
import assert from 'assert';
import {Customer} from '../../_support/customers.entity';
import {initClient} from '../../_support/init-client';

const client = initClient();

describe('create() method', function () {


    it('should create and return new instance', async function () {
        const values = {
            givenName: 'G' + Math.trunc(Math.random() * 10000),
            familyName: 'F' + Math.trunc(Math.random() * 10000),
            countryCode: 'TR'
        }
        const repo = client.getRepository<Customer>(Customer);
        const c = await repo.count();
        const customer = await repo.create(values);
        assert.ok(customer);
        assert.ok(customer instanceof Customer);
        assert.ok(customer.id);
        assert.ok(customer.id > 0);
        assert.strictEqual(customer.givenName, customer.givenName);
        assert.strictEqual(customer.familyName, customer.familyName);
        const x = await repo.findByPk(customer, {
            columns: ['id', 'givenName', 'familyName', 'countryCode', 'country']
        });
        const c2 = await repo.count();
        assert.strictEqual(c2, c + 1);
        assert.strictEqual(x.id, customer.id);
        assert.strictEqual(x.givenName, customer.givenName);
        assert.strictEqual(x.familyName, customer.familyName);
        assert.strictEqual(x.countryCode, customer.countryCode);
        assert.strictEqual(x.country.code, customer.countryCode);
    });

    it('should apply transformWrite function', async function () {
        const values = {
            givenName: 'G' + Math.trunc(Math.random() * 10000),
            familyName: 'F' + Math.trunc(Math.random() * 10000),
            countryCode: 'TR',
            gender: 'Male'
        }
        const repo = client.getRepository<Customer>(Customer);
        const customer = await repo.create(values);
        assert.ok(customer);
        const x = await repo.findByPk(customer, {columns: ['id', 'gender']});
        assert.strictEqual(x.id, customer.id);
        assert.strictEqual(x.gender, 'Male');
    });

    it('should work within transaction', async function () {
        let c = 0;
        return client.acquire(async (connection) => {
            const values = {
                givenName: 'abc',
                familyName: 'def'
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

describe('createOnly() method', function () {

    it('should not use "returning" query for fast execution', async function () {
        return client.acquire(async (connection) => {
            const values = {
                givenName: 'abc',
                familyName: 'def'
            };
            const repo = connection.getRepository<Customer>(Customer);
            let sql = '';
            connection.on('execute', req => {
                sql = req.sql;
            });
            await repo.createOnly(values);
            assert.ok(!sql.includes('returning'));
        });
    });

});
