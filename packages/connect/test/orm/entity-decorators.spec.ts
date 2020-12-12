/* eslint-disable @typescript-eslint/unbound-method,@typescript-eslint/no-unused-vars */
import '../_support/env';
import * as assert from 'assert';
import {
    AfterInsert, AfterRemove, AfterUpdate,
    BeforeInsert,
    BeforeRemove,
    BeforeUpdate,
    Column,
    Entity,
    Generated,
    Index,
    PrimaryKey
} from '@sqb/connect';

describe('Entity decorators', function () {

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
            assert.strictEqual(meta.name, 'CustomEntity');
        });

        it(`should define name with options object`, () => {
            @Entity({name: 'CustomEntity'})
            class MyEntity {

            }

            const meta = Entity.getMetadata(MyEntity);
            assert.ok(meta);
            assert.strictEqual(meta.name, 'CustomEntity');
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

    });

    describe('PrimaryIndex()', function () {

        it(`should define primary index field with string argument`, () => {
            @PrimaryKey('id')
            class MyEntity {

            }

            const meta = Entity.getMetadata(MyEntity);
            assert.ok(meta);
            assert.ok(meta.primaryIndex);
            assert.strictEqual(meta.primaryIndex.column, 'id');
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
            assert.strictEqual(meta.primaryIndex.column, 'id');
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
            assert.strictEqual(meta.primaryIndex.column, 'id');
            assert.strictEqual(meta.primaryIndex.name, 'px_myentity_id');
            assert.strictEqual(meta.primaryIndex.unique, true);
        });

        it(`should throw error on invalid argument`, () => {

            assert.throws(() => {
                // @ts-ignore
                @PrimaryKey()
                class MyEntity {

                }
            }, /You must specify primary index field/);

            assert.throws(() => {
                // @ts-ignore
                @PrimaryKey({})
                class MyEntity {

                }
            }, /You must specify primary index field/);
        });

    });

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

    describe('Column()', function () {

        it(`should add column metadata`, () => {
            class MyEntity {
                @Column()
                id: string
            }

            const meta = Entity.getMetadata(MyEntity);
            assert.ok(meta);
            assert.strictEqual(meta.name, 'MyEntity');
            const idColumn = meta.getColumn('id');
            assert.ok(idColumn);
            assert.strictEqual(idColumn.name, 'id');
        });

        it(`should set "type" if first argument is string`, () => {
            class MyEntity {
                @Column('int')
                id: string
            }

            const meta = Entity.getMetadata(MyEntity);
            assert.ok(meta);
            const idColumn = meta.getColumn('id');
            assert.ok(idColumn);
            assert.strictEqual(idColumn.type, 'int');
        });

        it(`should define options with object`, () => {
            class MyEntity {
                @Column({
                    type: 'number',
                    fieldName: '_id',
                    comment: 'comment',
                    defaultValue: 123,
                    array: false,
                    collation: 'collation',
                    enum: [1, 2, 3],
                    length: 5,
                    nullable: true,
                    precision: 8,
                    scale: 2,
                    autoGenerate: 'uuid'
                })
                id: string
            }

            const meta = Entity.getMetadata(MyEntity);
            assert.ok(meta);
            const idColumn = meta.getColumn('id');
            assert.ok(idColumn);
            assert.strictEqual(idColumn.type, 'number');
            assert.strictEqual(idColumn.fieldName, '_id');
            assert.strictEqual(idColumn.comment, 'comment');
            assert.strictEqual(idColumn.defaultValue, 123);
            assert.strictEqual(idColumn.array, false);
            assert.strictEqual(idColumn.collation, 'collation');
            assert.deepStrictEqual(idColumn.enum, [1, 2, 3]);
            assert.strictEqual(idColumn.length, 5);
            assert.strictEqual(idColumn.nullable, true);
            assert.strictEqual(idColumn.precision, 8);
            assert.strictEqual(idColumn.scale, 2);
            assert.strictEqual(idColumn.autoGenerate, 'uuid');
        });

    });

    describe('Generated()', function () {

        it(`should add column metadata and set autoGenerate option`, () => {
            class MyEntity {
                @Generated('uuid')
                id: string
            }

            const meta = Entity.getMetadata(MyEntity);
            assert.ok(meta);
            assert.strictEqual(meta.name, 'MyEntity');
            const idColumn = meta.getColumn('id');
            assert.ok(idColumn);
            assert.strictEqual(idColumn.autoGenerate, 'uuid');
        });
    });

    describe('BeforeInsert()', function () {

        it(`should define beforeInsert event`, () => {
            class MyEntity {
                @BeforeInsert()
                doBeforeInsert(): void {
                    //
                }
            }

            const meta = Entity.getMetadata(MyEntity);
            assert.ok(meta);
            assert.strictEqual(meta.name, 'MyEntity');
            assert.strictEqual(meta.eventListeners.length, 1);
            assert.strictEqual(meta.eventListeners[0].event, 'beforeinsert');
            assert.strictEqual(meta.eventListeners[0].fn, MyEntity.prototype.doBeforeInsert);
        });

        it(`should throw error on invalid argument`, () => {
            assert.throws(() => {
                class MyEntity {
                    @BeforeInsert()
                    notAFunction: 12
                }
            }, /Property must be a function/);
        });

    });

    describe('BeforeUpdate()', function () {

        it(`should define beforeUpdate event`, () => {
            class MyEntity {
                @BeforeUpdate()
                doBeforeUpdate(): void {
                    //
                }
            }

            const meta = Entity.getMetadata(MyEntity);
            assert.ok(meta);
            assert.strictEqual(meta.name, 'MyEntity');
            assert.strictEqual(meta.eventListeners.length, 1);
            assert.strictEqual(meta.eventListeners[0].event, 'beforeupdate');
            assert.strictEqual(meta.eventListeners[0].fn, MyEntity.prototype.doBeforeUpdate);
        });

        it(`should throw error on invalid argument`, () => {
            assert.throws(() => {
                class MyEntity {
                    @BeforeUpdate()
                    notAFunction: 12
                }
            }, /Property must be a function/);

        });

    });

    describe('BeforeRemove()', function () {

        it(`should define beforeRemove event`, () => {
            class MyEntity {
                @BeforeRemove()
                doBeforeRemove(): void {
                    //
                }
            }

            const meta = Entity.getMetadata(MyEntity);
            assert.ok(meta);
            assert.strictEqual(meta.name, 'MyEntity');
            assert.strictEqual(meta.eventListeners.length, 1);
            assert.strictEqual(meta.eventListeners[0].event, 'beforeremove');
            assert.strictEqual(meta.eventListeners[0].fn, MyEntity.prototype.doBeforeRemove);
        });

        it(`should throw error on invalid argument`, () => {
            assert.throws(() => {
                class MyEntity {
                    @BeforeRemove()
                    notAFunction: 12
                }
            }, /Property must be a function/);

        });

    });

    describe('AfterInsert()', function () {

        it(`should define beforeInsert event`, () => {
            class MyEntity {
                @AfterInsert()
                doAfterInsert(): void {
                    //
                }
            }

            const meta = Entity.getMetadata(MyEntity);
            assert.ok(meta);
            assert.strictEqual(meta.name, 'MyEntity');
            assert.strictEqual(meta.eventListeners.length, 1);
            assert.strictEqual(meta.eventListeners[0].event, 'afterinsert');
            assert.strictEqual(meta.eventListeners[0].fn, MyEntity.prototype.doAfterInsert);
        });

        it(`should throw error on invalid argument`, () => {
            assert.throws(() => {
                class MyEntity {
                    @AfterInsert()
                    notAFunction: 12
                }
            }, /Property must be a function/);

        });

    });

    describe('AfterUpdate()', function () {

        it(`should define beforeUpdate event`, () => {
            class MyEntity {
                @AfterUpdate()
                doAfterUpdate(): void {
                    //
                }
            }

            const meta = Entity.getMetadata(MyEntity);
            assert.ok(meta);
            assert.strictEqual(meta.name, 'MyEntity');
            assert.strictEqual(meta.eventListeners.length, 1);
            assert.strictEqual(meta.eventListeners[0].event, 'afterupdate');
            assert.strictEqual(meta.eventListeners[0].fn, MyEntity.prototype.doAfterUpdate);
        });

        it(`should throw error on invalid argument`, () => {
            assert.throws(() => {
                class MyEntity {
                    @AfterUpdate()
                    notAFunction: 12
                }
            }, /Property must be a function/);

        });

    });

    describe('AfterRemove()', function () {

        it(`should define beforeRemove event`, () => {
            class MyEntity {
                @AfterRemove()
                doAfterRemove(): void {
                    //
                }
            }

            const meta = Entity.getMetadata(MyEntity);
            assert.ok(meta);
            assert.strictEqual(meta.name, 'MyEntity');
            assert.strictEqual(meta.eventListeners.length, 1);
            assert.strictEqual(meta.eventListeners[0].event, 'afterremove');
            assert.strictEqual(meta.eventListeners[0].fn, MyEntity.prototype.doAfterRemove);
        });

        it(`should throw error on invalid argument`, () => {
            assert.throws(() => {
                class MyEntity {
                    @AfterRemove()
                    notAFunction: 12
                }
            }, /Property must be a function/);

        });

    });

});
