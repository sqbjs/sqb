import '../../_support/env';
import assert from 'assert';
import {initClient} from '../../_support/init-client';
import {Customer} from '../../_support/customer.entity';

describe('find() many to many relations', function () {

    const client = initClient();

    it('should return associated instances', async function () {
        const repo = client().getRepository(Customer);
        const rows = await repo.findAll({
            filter: {'id': 1},
            elements: ['id', 'givenName', 'tags']
        });
        assert.strictEqual(rows.length, 1);
        assert.strictEqual(rows[0].id, 1);
        for (const row of rows) {
            assert.ok(Array.isArray(row.tags));
            assert.strictEqual(row.tags.length, 2);
            for (const tag of row.tags) {
                assert.ok(tag.id === 1 || tag.id === 5);
            }
        }
    });

    it('should specify returning elements', async function () {
        const repo = client().getRepository(Customer);
        const rows = await repo.findAll({
            filter: {'id': 1},
            elements: ['id', 'tags.color']
        });
        assert.ok(rows);
        assert.strictEqual(rows.length, 1);
        for (const customer of rows) {
            assert.ok(Array.isArray(customer.tags));
            assert.ok(customer.tags.length);
            for (const tag of customer.tags) {
                assert.deepStrictEqual(Object.keys(tag), ['color']);

            }
        }
    });

    it('should filter by m2m relation', async function () {
        const repo = client().getRepository(Customer);
        const rows = await repo.findAll({
            include: ['tags'],
            filter: {'tags.color': 'yellow'}
        });
        assert.ok(rows);
        assert.strictEqual(rows.length, 1);
        for (const customer of rows) {
            assert.ok(Array.isArray(customer.tags));
            assert.ok(customer.tags.length);
            assert.ok(customer.tags.find(tag => tag.color === 'yellow'));
        }
    });

});
