/* eslint-disable @typescript-eslint/unbound-method,@typescript-eslint/no-unused-vars */
import '../../_support/env';
import * as assert from 'assert';
import {Column, Entity, PrimaryKey} from '@sqb/connect';

describe('Entity()', function () {

    it(`should attach metadata`, () => {
        @Entity()
        class MyEntity {

        }

        const meta = Entity.getMetadata(MyEntity);
        assert.ok(meta);
        assert.strictEqual(meta.name, 'MyEntity');
    });

    it(`should define custom name if first argument is string`, () => {
        @Entity('CustomEntity')
        class MyEntity {

        }

        const meta = Entity.getMetadata(MyEntity);
        assert.ok(meta);
        assert.strictEqual(meta.name, 'MyEntity');
        assert.strictEqual(meta.tableName, 'CustomEntity');
    });

    it(`should define name with options object`, () => {
        @Entity({tableName: 'CustomEntity'})
        class MyEntity {

        }

        const meta = Entity.getMetadata(MyEntity);
        assert.ok(meta);
        assert.strictEqual(meta.name, 'MyEntity');
        assert.strictEqual(meta.tableName, 'CustomEntity');
    });

    it(`should define schema`, () => {
        @Entity({schema: 'my_schema', comment: 'comment'})
        class MyEntity {

        }

        const meta = Entity.getMetadata(MyEntity);
        assert.ok(meta);
        assert.strictEqual(meta.schema, 'my_schema');
        assert.strictEqual(meta.comment, 'comment');
    });

    it(`should inherit from other class`, () => {

        class Base {
            @Column()
            @PrimaryKey()
            id: number
        }

        @Entity({schema: 'my_schema', comment: 'comment'})
        class MyEntity extends Base {
            @Column()
            code: string
        }

        const baseMeta = Entity.getMetadata(Base);
        const meta = Entity.getMetadata(MyEntity);
        assert.ok(meta);
        assert.ok(meta.getColumn('id'));
        assert.ok(meta.primaryIndex);
        assert.deepStrictEqual(meta.primaryIndex.column, baseMeta.primaryIndex.column);
    });

});
