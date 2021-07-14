/* eslint-disable @typescript-eslint/unbound-method,@typescript-eslint/no-unused-vars */
import '../../_support/env';
import * as assert from 'assert';
import {
    Column,
    DataType,
    Entity,
    AfterInsert, AfterDestroy, AfterUpdate, BeforeInsert, BeforeDestroy, BeforeUpdate
} from '@sqb/connect';

describe('Data Column', function () {

    it(`should @Column() decorator init column metadata`, () => {
        class MyEntity {
            @Column()
            id: string
        }

        const meta = Entity.getMetadata(MyEntity);
        assert.ok(meta);
        assert.strictEqual(meta.name, 'MyEntity');
        const idColumn = meta.getColumnElement('id');
        assert.ok(idColumn);
        assert.strictEqual(idColumn.name, 'id');
    });

    it(`should @Column(DataType) decorator set dataType`, () => {
        class MyEntity {
            @Column(DataType.GUID)
            id: string
        }

        const meta = Entity.getMetadata(MyEntity);
        assert.ok(meta);
        const idColumn = meta.getColumnElement('id');
        assert.ok(idColumn);
        assert.strictEqual(idColumn.dataType, DataType.GUID);
    });

    it(`should @Column(object) decorator set column options`, () => {
        class MyEntity {
            @Column({
                type: Number,
                dataType: DataType.NUMBER,
                fieldName: '_id',
                comment: 'comment',
                collation: 'collation',
                autoGenerated: 'increment',
                default: 123,
                length: 5,
                precision: 8,
                scale: 2,
                notNull: false,
                hidden: true,
                noInsert: true,
                noUpdate: true,
                enum: [1, 2, 3]
            })
            id: number
        }

        const meta = Entity.getMetadata(MyEntity);
        assert.ok(meta);
        const idColumn = meta.getColumnElement('id');
        assert.ok(idColumn);
        assert.strictEqual(idColumn.type, Number);
        assert.strictEqual(idColumn.dataType, DataType.NUMBER);
        assert.strictEqual(idColumn.fieldName, '_id');
        assert.strictEqual(idColumn.comment, 'comment');
        assert.strictEqual(idColumn.default, 123);
        assert.strictEqual(idColumn.collation, 'collation');
        assert.strictEqual(idColumn.autoGenerated, 'increment');
        assert.deepStrictEqual(idColumn.enum, [1, 2, 3]);
        assert.strictEqual(idColumn.length, 5);
        assert.strictEqual(idColumn.precision, 8);
        assert.strictEqual(idColumn.scale, 2);
        assert.strictEqual(idColumn.noInsert, true);
        assert.strictEqual(idColumn.noUpdate, true);
        assert.strictEqual(idColumn.notNull, false);
    });

    it(`should @Column() decorator auto detect "type" and "dataType" using reflection`, () => {
        class MyEntity {
            @Column()
            col1: string;

            @Column()
            col2: number;

            @Column()
            col3: boolean;

            @Column()
            col4: Date;

            @Column()
            col5: Buffer;

            @Column()
            col6: any[];
        }

        const meta = Entity.getMetadata(MyEntity);
        assert.ok(meta);
        let col = meta.getColumnElement('col1');
        assert.strictEqual(col.type, String);
        assert.strictEqual(col.dataType, DataType.VARCHAR);
        col = meta.getColumnElement('col2');
        assert.strictEqual(col.type, Number);
        assert.strictEqual(col.dataType, DataType.NUMBER);
        col = meta.getColumnElement('col3');
        assert.strictEqual(col.type, Boolean);
        assert.strictEqual(col.dataType, DataType.BOOL);
        col = meta.getColumnElement('col4');
        assert.strictEqual(col.type, Date);
        assert.strictEqual(col.dataType, DataType.TIMESTAMP);
        col = meta.getColumnElement('col5');
        assert.strictEqual(col.type, Buffer);
        assert.strictEqual(col.dataType, DataType.BINARY);
        col = meta.getColumnElement('col6');
        assert.strictEqual(col.type, String);
        assert.strictEqual(col.dataType, DataType.VARCHAR);
        assert.strictEqual(col.isArray, true);
    });

    it(`should @AfterInsert() decorator add after-insert hook`, () => {
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
        assert.strictEqual(meta.eventListeners[0].event, 'after-insert');
        assert.strictEqual(meta.eventListeners[0].fn, MyEntity.prototype.doAfterInsert);
    });

    it(`should validate @AfterInsert() decorator is used for function property`, () => {
        assert.throws(() => {
            // noinspection JSUnusedLocalSymbols
            class MyEntity {
                @AfterInsert()
                notAFunction: 12
            }
        }, /Property must be a function/);

    });

    it(`should @AfterDestroy() decorator add after-destroy hook`, () => {
        class MyEntity {
            @AfterDestroy()
            doAfterDestroy(): void {
                //
            }
        }

        const meta = Entity.getMetadata(MyEntity);
        assert.ok(meta);
        assert.strictEqual(meta.name, 'MyEntity');
        assert.strictEqual(meta.eventListeners.length, 1);
        assert.strictEqual(meta.eventListeners[0].event, 'after-destroy');
        assert.strictEqual(meta.eventListeners[0].fn, MyEntity.prototype.doAfterDestroy);
    });

    it(`should validate @AfterDestroy() decorator is used for function property`, () => {
        assert.throws(() => {
            // noinspection JSUnusedLocalSymbols
            class MyEntity {
                @AfterDestroy()
                notAFunction: 12
            }
        }, /Property must be a function/);

    });

    it(`should @AfterUpdate() decorator add after-update hook`, () => {
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
        assert.strictEqual(meta.eventListeners[0].event, 'after-update');
        assert.strictEqual(meta.eventListeners[0].fn, MyEntity.prototype.doAfterUpdate);
    });

    it(`should validate @AfterUpdate() decorator is used for function property`, () => {
        assert.throws(() => {
            // noinspection JSUnusedLocalSymbols
            class MyEntity {
                @AfterUpdate()
                notAFunction: 12
            }
        }, /Property must be a function/);

    });

    it(`should @BeforeInsert() decorator add before-insert hook`, () => {
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
        assert.strictEqual(meta.eventListeners[0].event, 'before-insert');
        assert.strictEqual(meta.eventListeners[0].fn, MyEntity.prototype.doBeforeInsert);
    });

    it(`should validate @BeforeInsert() decorator is used for function property`, () => {
        assert.throws(() => {
            // noinspection JSUnusedLocalSymbols
            class MyEntity {
                @BeforeInsert()
                notAFunction: 12
            }
        }, /Property must be a function/);

    });

    it(`should @BeforeDestroy() decorator add before-destroy hook`, () => {
        class MyEntity {
            @BeforeDestroy()
            doBeforeDestroy(): void {
                //
            }
        }

        const meta = Entity.getMetadata(MyEntity);
        assert.ok(meta);
        assert.strictEqual(meta.name, 'MyEntity');
        assert.strictEqual(meta.eventListeners.length, 1);
        assert.strictEqual(meta.eventListeners[0].event, 'before-destroy');
        assert.strictEqual(meta.eventListeners[0].fn, MyEntity.prototype.doBeforeDestroy);
    });

    it(`should validate @BeforeDestroy() decorator is used for function property`, () => {
        assert.throws(() => {
            // noinspection JSUnusedLocalSymbols
            class MyEntity {
                @BeforeDestroy()
                notAFunction: 12
            }
        }, /Property must be a function/);

    });

    it(`should @BeforeUpdate() decorator add before-update hook`, () => {
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
        assert.strictEqual(meta.eventListeners[0].event, 'before-update');
        assert.strictEqual(meta.eventListeners[0].fn, MyEntity.prototype.doBeforeUpdate);
    });

    it(`should validate @BeforeUpdate() decorator is used for function property`, () => {
        assert.throws(() => {
            // noinspection JSUnusedLocalSymbols
            class MyEntity {
                @BeforeUpdate()
                notAFunction: 12
            }
        }, /Property must be a function/);

    });

});
