/* eslint-disable @typescript-eslint/unbound-method,@typescript-eslint/no-unused-vars */
import '../../_support/env';
import * as assert from 'assert';
import {Entity, Index} from '@sqb/connect';

describe('Index()', function () {

    it(`should define index field with string argument`, () => {
        @Index('id')
        class MyEntity {

        }

        const meta = Entity.getMetadata(MyEntity);
        assert.ok(meta);
        assert.strictEqual(meta.indexes.length, 1);
        assert.strictEqual(meta.indexes[0].column, 'id');
    });

    it(`should define index field with object definition`, () => {

        @Index(['name'], {name: 'idx_myentity_name', unique: true})
        class MyEntity {

        }

        const meta = Entity.getMetadata(MyEntity);
        assert.ok(meta);
        assert.strictEqual(meta.indexes.length, 1);
        assert.strictEqual(meta.indexes[0].name, 'idx_myentity_name');
        assert.strictEqual(meta.indexes[0].column, 'name');
        assert.deepStrictEqual(meta.indexes[0].unique, true);
    });

    it(`should be used as PropertyDecorator`, () => {

        class MyEntity {
            @Index({unique: true})
            id: string;

        }

        const meta = Entity.getMetadata(MyEntity);
        assert.ok(meta);
        assert.strictEqual(meta.indexes.length, 1);
        assert.deepStrictEqual(meta.indexes[0].column, 'id');
        assert.deepStrictEqual(meta.indexes[0].unique, true);
    });

    it(`should throw error on invalid argument`, () => {

        assert.throws(() => {
            // @ts-ignore
            @Index()
            class MyEntity {

            }
        }, /You must specify index field/);

        assert.throws(() => {
            // @ts-ignore
            @Index({})
            class MyEntity {

            }
        }, /You must specify index field/);
    });

});
