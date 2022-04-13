/* eslint-disable @typescript-eslint/unbound-method,@typescript-eslint/no-unused-vars */
import '../../_support/env';
import * as assert from 'assert';
import {Entity, PrimaryKey} from '@sqb/connect';

describe('PrimaryKey', function () {

    it(`should define primary index field with string argument`, () => {
        @PrimaryKey('id')
        class MyEntity {

        }

        const primaryIndex = Entity.getPrimaryIndex(MyEntity);
        assert.ok(primaryIndex);
        assert.deepStrictEqual(primaryIndex.columns, ['id']);
        assert.strictEqual(primaryIndex.unique, true);
    });

    it(`should define primary index field with object definition`, () => {

        @PrimaryKey(['id'], {name: 'px_myentity_id'})
        class MyEntity {

        }

        const primaryIndex = Entity.getPrimaryIndex(MyEntity);
        assert.ok(primaryIndex);
        assert.strictEqual(primaryIndex.name, 'px_myentity_id');
        assert.deepStrictEqual(primaryIndex.columns, ['id']);
        assert.strictEqual(primaryIndex.unique, true);
    });

    it(`should be used as PropertyDecorator`, () => {

        class MyEntity {
            @PrimaryKey({name: 'px_myentity_id'})
            id: string;

        }

        const primaryIndex = Entity.getPrimaryIndex(MyEntity);
        assert.ok(primaryIndex);
        assert.deepStrictEqual(primaryIndex.columns, ['id']);
        assert.strictEqual(primaryIndex.name, 'px_myentity_id');
        assert.strictEqual(primaryIndex.unique, true);
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
