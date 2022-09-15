/* eslint-disable @typescript-eslint/no-non-null-assertion,@typescript-eslint/no-unused-vars */
// noinspection JSUnusedLocalSymbols

import {
    AfterDestroy, AfterInsert, AfterUpdate, BeforeDestroy, BeforeInsert, BeforeUpdate,
    Column,
    DataType,
    Entity, EntityMetadata,
} from '@sqb/connect';

describe('Model / Data Column', function () {

    it(`should @Column() decorator init column metadata`, () => {
        class MyEntity {
            @Column()
            id: string
        }

        const meta = Entity.getMetadata(MyEntity);
        expect(meta).toBeDefined();
        expect(meta!.name).toStrictEqual('MyEntity');
        const idColumn = EntityMetadata.getColumnField(meta!, 'id');
        expect(idColumn).toBeDefined();
        expect(idColumn!.name).toStrictEqual('id');
    });

    it(`should @Column(DataType) decorator set dataType`, () => {
        class MyEntity {
            @Column(DataType.GUID)
            id: string
        }

        const meta = Entity.getMetadata(MyEntity);
        expect(meta).toBeDefined();
        const idColumn = EntityMetadata.getColumnField(meta!, 'id');
        expect(idColumn).toBeDefined();
        expect(idColumn!.dataType).toStrictEqual(DataType.GUID);
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
        expect(meta).toBeDefined();
        const idColumn = EntityMetadata.getColumnField(meta!, 'id');
        expect(idColumn).toBeDefined();
        expect(idColumn!.type).toStrictEqual(Number);
        expect(idColumn!.dataType).toStrictEqual(DataType.NUMBER);
        expect(idColumn!.fieldName).toStrictEqual('_id');
        expect(idColumn!.comment).toStrictEqual('comment');
        expect(idColumn!.default).toStrictEqual(123);
        expect(idColumn!.collation).toStrictEqual('collation');
        expect(idColumn!.autoGenerated).toStrictEqual('increment');
        expect(idColumn!.enum).toStrictEqual([1, 2, 3]);
        expect(idColumn!.length).toStrictEqual(5);
        expect(idColumn!.precision).toStrictEqual(8);
        expect(idColumn!.scale,).toStrictEqual(2);
        expect(idColumn!.noInsert).toStrictEqual(true);
        expect(idColumn!.noUpdate).toStrictEqual(true);
        expect(idColumn!.notNull).toStrictEqual(false);
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
        expect(meta).toBeDefined();
        let col = EntityMetadata.getColumnField(meta!, 'col1');
        expect(col!.type).toStrictEqual(String);
        expect(col!.dataType).toStrictEqual(DataType.VARCHAR);
        col = EntityMetadata.getColumnField(meta!, 'col2');
        expect(col!.type).toStrictEqual(Number);
        expect(col!.dataType).toStrictEqual(DataType.NUMBER);
        col = EntityMetadata.getColumnField(meta!, 'col3');
        expect(col!.type).toStrictEqual(Boolean);
        expect(col!.dataType).toStrictEqual(DataType.BOOL);
        col = EntityMetadata.getColumnField(meta!, 'col4');
        expect(col!.type).toStrictEqual(Date);
        expect(col!.dataType).toStrictEqual(DataType.TIMESTAMP);
        col = EntityMetadata.getColumnField(meta!, 'col5');
        expect(col!.type).toStrictEqual(Buffer);
        expect(col!.dataType).toStrictEqual(DataType.BINARY);
        col = EntityMetadata.getColumnField(meta!, 'col6');
        expect(col!.type).toStrictEqual(String);
        expect(col!.dataType).toStrictEqual(DataType.VARCHAR);
        expect(col!.isArray).toStrictEqual(true);
    });

    it(`should @AfterInsert() decorator add after-insert hook`, () => {
        class MyEntity {
            @AfterInsert()
            doAfterInsert(): void {
                //
            }
        }

        const meta = Entity.getMetadata(MyEntity);
        expect(meta).toBeDefined();
        expect(meta!.name).toStrictEqual('MyEntity');
        expect(meta!.eventListeners).toBeDefined();
        expect(meta!.eventListeners['after-insert']).toBeDefined();
        expect(meta!.eventListeners['after-insert'][0]).toStrictEqual(MyEntity.prototype.doAfterInsert);
    });

    it(`should validate @AfterInsert() decorator is used for function property`, () => {
        expect(() => {
            class MyEntity {
                @AfterInsert()
                notAFunction: 12
            }
        }).toThrow('Property must be a function');

    });

    it(`should @AfterDestroy() decorator add after-destroy hook`, () => {
        class MyEntity {
            @AfterDestroy()
            doAfterDestroy(): void {
                //
            }
        }

        const meta = Entity.getMetadata(MyEntity);
        expect(meta).toBeDefined();
        expect(meta!.name).toStrictEqual('MyEntity');
        expect(meta!.eventListeners).toBeDefined();
        expect(meta!.eventListeners['after-destroy']).toBeDefined();
        expect(meta!.eventListeners['after-destroy'][0]).toStrictEqual(MyEntity.prototype.doAfterDestroy);
    });

    it(`should validate @AfterDestroy() decorator is used for function property`, () => {
        expect(() => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            class MyEntity {
                @AfterDestroy()
                notAFunction: 12
            }
        }).toThrow('Property must be a function');
    });

    it(`should @AfterUpdate() decorator add after-update hook`, () => {
        class MyEntity {
            @AfterUpdate()
            doAfterUpdate(): void {
                //
            }
        }

        const meta = Entity.getMetadata(MyEntity);
        expect(meta).toBeDefined();
        expect(meta!.name).toStrictEqual('MyEntity');
        expect(meta!.eventListeners).toBeDefined();
        expect(meta!.eventListeners['after-update']).toBeDefined();
        expect(meta!.eventListeners['after-update'][0]).toStrictEqual(MyEntity.prototype.doAfterUpdate);
    });

    it(`should validate @AfterUpdate() decorator is used for function property`, () => {
        expect(() => {
            class MyEntity {
                @AfterUpdate()
                notAFunction: 12
            }
        }).toThrow('Property must be a function');

    });

    it(`should @BeforeInsert() decorator add before-insert hook`, () => {
        class MyEntity {
            @BeforeInsert()
            doBeforeInsert(): void {
                //
            }
        }

        const meta = Entity.getMetadata(MyEntity);
        expect(meta).toBeDefined();
        expect(meta!.name).toStrictEqual('MyEntity');
        expect(meta!.eventListeners).toBeDefined();
        expect(meta!.eventListeners['before-insert']).toBeDefined();
        expect(meta!.eventListeners['before-insert'][0]).toStrictEqual(MyEntity.prototype.doBeforeInsert);
    });

    it(`should validate @BeforeInsert() decorator is used for function property`, () => {
        expect(() => {
            class MyEntity {
                @BeforeInsert()
                notAFunction: 12
            }
        }).toThrow('Property must be a function');
    });

    it(`should @BeforeDestroy() decorator add before-destroy hook`, () => {
        class MyEntity {
            @BeforeDestroy()
            doBeforeDestroy(): void {
                //
            }
        }

        const meta = Entity.getMetadata(MyEntity);
        expect(meta).toBeDefined();
        expect(meta!.name).toStrictEqual('MyEntity');
        expect(meta!.eventListeners).toBeDefined();
        expect(meta!.eventListeners['before-destroy']).toBeDefined();
        expect(meta!.eventListeners['before-destroy'][0]).toStrictEqual(MyEntity.prototype.doBeforeDestroy);
    });

    it(`should validate @BeforeDestroy() decorator is used for function property`, () => {
        expect(() => {
            class MyEntity {
                @BeforeDestroy()
                notAFunction: 12
            }
        }).toThrow(/Property must be a function/);
    });

    it(`should @BeforeUpdate() decorator add before-update hook`, () => {
        class MyEntity {
            @BeforeUpdate()
            doBeforeUpdate(): void {
                //
            }
        }

        const meta = Entity.getMetadata(MyEntity);
        expect(meta).toBeDefined();
        expect(meta!.name).toStrictEqual('MyEntity');
        expect(meta!.eventListeners).toBeDefined();
        expect(meta!.eventListeners['before-update']).toBeDefined();
        expect(meta!.eventListeners['before-update'][0]).toStrictEqual(MyEntity.prototype.doBeforeUpdate);
    });

    it(`should validate @BeforeUpdate() decorator is used for function property`, () => {
        expect(() => {
            class MyEntity {
                @BeforeUpdate()
                notAFunction: 12
            }
        }).toThrow('Property must be a function');

    });

});