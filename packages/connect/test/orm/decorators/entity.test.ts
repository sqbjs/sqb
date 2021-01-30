/* eslint-disable @typescript-eslint/unbound-method,@typescript-eslint/no-unused-vars */
import '../../_support/env';
import * as assert from 'assert';
import {Column, DataType, Entity, PrimaryKey} from '@sqb/connect';

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

    it(`should override toJSON prototype method`, () => {
        @Entity()
        class MyEntity {
            @Column(DataType.DATE)
            date1: Date;

            @Column()
            date2: Date;

            @Column()
            buffer: Buffer;

            @Column(DataType.INTEGER)
            int: number;

            @Column(DataType.SMALLINT)
            smallint: number;

            @Column(DataType.BIGINT)
            bigint: bigint;

            // noinspection JSMismatchedCollectionQueryUpdate
            @Column(DataType.INTEGER)
            arr1: number[];

            toJSON: Function;
        }

        const inst = new MyEntity();
        inst.date1 = new Date('2008-01-31T01:25:18');
        inst.date2 = new Date('2008-01-31T01:25:18');
        inst.buffer = Buffer.from('012345');
        inst.int = 3.5;
        inst.smallint = 2.5;
        inst.bigint = BigInt(12345);
        inst.arr1 = [1, 2.5, 3.5];
        const o = inst.toJSON();

        assert.deepStrictEqual(o, {
            date1: '2008-01-31',
            date2: '2008-01-31T01:25:18',
            buffer: 'MDEyMzQ1',
            int: 3,
            smallint: 2,
            bigint: '12345',
            arr1: [1, 2, 3]
        });

        const s = JSON.stringify(inst);
        assert.strictEqual(s, '{"date1":"2008-01-31",' +
            '"date2":"2008-01-31T01:25:18","buffer":"MDEyMzQ1",' +
            '"int":3,"smallint":2,"bigint":"12345","arr1":[1,2,3]}');
    });

});
