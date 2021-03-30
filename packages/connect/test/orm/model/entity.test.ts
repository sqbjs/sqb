/* eslint-disable @typescript-eslint/unbound-method,@typescript-eslint/no-unused-vars */
import '../../_support/env';
import * as assert from 'assert';
import {
    BaseEntity,
    Column,
    DataType,
    NoInsert,
    NoUpdate,
    Entity,
    HasOne,
    PrimaryKey,
    getDataColumnNames, getElementNames, getInsertColumnNames, getUpdateColumnNames
} from '@sqb/connect';

describe('Entity', function () {

    it(`should @Entity() decorator attach metadata to class`, () => {
        @Entity()
        class MyEntity {

        }

        const meta = Entity.getMetadata(MyEntity);
        assert.ok(meta);
        assert.strictEqual(meta.name, 'MyEntity');
    });

    it(`should @Entity(string) decorator set tableName`, () => {
        @Entity('CustomEntity')
        class MyEntity {

        }

        const meta = Entity.getMetadata(MyEntity);
        assert.ok(meta);
        assert.strictEqual(meta.name, 'MyEntity');
        assert.strictEqual(meta.tableName, 'CustomEntity');
    });

    it(`should @Entity(object) decorator set options`, () => {
        @Entity({
            tableName: 'CustomEntity',
            schema: 'my_schema',
            comment: 'comment'

        })
        class MyEntity {

        }

        const meta = Entity.getMetadata(MyEntity);
        assert.ok(meta);
        assert.strictEqual(meta.name, 'MyEntity');
        assert.strictEqual(meta.tableName, 'CustomEntity');
        assert.strictEqual(meta.schema, 'my_schema');
        assert.strictEqual(meta.comment, 'comment');
    });

    it(`should inherit from other entity class`, () => {
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
        assert.ok(meta.getElement('id'));
        assert.ok(meta.primaryIndex);
        assert.deepStrictEqual(meta.primaryIndex.columns, baseMeta.primaryIndex.columns);
    });

    it(`should entity instance serialize to JSON`, () => {
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

            @Column()
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

    it(`should EntityDefinition.getElementNames() return all element names`, function () {
        @Entity()
        class Country {
            @Column()
            code: string;
        }

        @Entity()
        class BaseCustomer extends BaseEntity<BaseCustomer> {

            @Column()
            id: string;

            @Column()
            name: number;

            @HasOne()
            country: Country;

        }

        @Entity()
        class Customer extends BaseCustomer {
            @Column()
            code: string
        }

        assert.deepStrictEqual(getElementNames(Customer), ['id', 'name', 'country', 'code']);
    });

    it(`should EntityDefinition.getDataColumnNames() return only data column names`, function () {
        @Entity()
        class Country {
            @Column()
            code: string;
        }

        @Entity()
        class BaseCustomer extends BaseEntity<BaseCustomer> {

            @Column()
            id: string;

            @Column()
            name: number;

            @HasOne()
            country: Country;

        }

        @Entity()
        class Customer extends BaseCustomer {
            @Column()
            code: string
        }

        assert.deepStrictEqual(getDataColumnNames(Customer), ['id', 'name', 'code']);
    });

    it(`should getInsertColumnNames() return only data column names to insert`, function () {
        @Entity()
        class Country {
            @Column()
            code: string;
        }

        @Entity()
        class BaseCustomer extends BaseEntity<BaseCustomer> {

            @Column()
            @NoInsert
            id: string;

            @Column()
            @NoUpdate
            name: number;

            @HasOne()
            country: Country;

        }

        @Entity()
        class Customer extends BaseCustomer {
            @Column()
            code: string
        }

        assert.deepStrictEqual(getInsertColumnNames(Customer), ['name', 'code']);
    });

    it(`should EntityDefinition.getInsertColumnNames() return only data column names to insert`, function () {
        @Entity()
        class Country {
            @Column()
            code: string;
        }

        @Entity()
        class BaseCustomer extends BaseEntity<BaseCustomer> {

            @Column()
            @NoInsert
            id: string;

            @Column()
            @NoUpdate
            name: number;

            @HasOne()
            country: Country;

        }

        @Entity()
        class Customer extends BaseCustomer {
            @Column()
            code: string
        }

        assert.deepStrictEqual(getUpdateColumnNames(Customer), ['id', 'code']);
    });

});