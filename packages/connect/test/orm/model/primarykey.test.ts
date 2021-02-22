/* eslint-disable @typescript-eslint/unbound-method,@typescript-eslint/no-unused-vars */
import '../../_support/env';
import * as assert from 'assert';
import {Entity, PrimaryKey} from '@sqb/connect';

describe('PrimaryKey', function () {

    it(`should define primary index field with string argument`, () => {
        @PrimaryKey('id')
        class MyEntity {

        }

        const meta = Entity.getMetadata(MyEntity);
        assert.ok(meta);
        assert.ok(meta.primaryIndex);
        assert.deepStrictEqual(meta.primaryIndex.columns, ['id']);
        assert.strictEqual(meta.primaryIndex.unique, true);
    });

    it(`should define primary index field with object definition`, () => {

        @PrimaryKey(['id'], {name: 'px_myentity_id'})
        class MyEntity {

        }

        const meta = Entity.getMetadata(MyEntity);
        assert.ok(meta);
        assert.ok(meta.primaryIndex);
        assert.strictEqual(meta.primaryIndex.name, 'px_myentity_id');
        assert.deepStrictEqual(meta.primaryIndex.columns, ['id']);
        assert.strictEqual(meta.primaryIndex.unique, true);
    });

    it(`should be used as PropertyDecorator`, () => {

        class MyEntity {
            @PrimaryKey({name: 'px_myentity_id'})
            id: string;

        }

        const meta = Entity.getMetadata(MyEntity);
        assert.ok(meta);
        assert.ok(meta.primaryIndex);
        assert.deepStrictEqual(meta.primaryIndex.columns, ['id']);
        assert.strictEqual(meta.primaryIndex.name, 'px_myentity_id');
        assert.strictEqual(meta.primaryIndex.unique, true);
    });

    it(`should throw error on invalid argument`, () => {

        assert.throws(() => {
            // @ts-ignore
            @PrimaryKey()
            class MyEntity {

            }
        }, /You must specify primary index column/);

        assert.throws(() => {
            // @ts-ignore
            @PrimaryKey({})
            class MyEntity {

            }
        }, /You must specify primary index column/);
    });

});
