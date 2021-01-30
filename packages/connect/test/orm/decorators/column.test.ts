/* eslint-disable @typescript-eslint/unbound-method,@typescript-eslint/no-unused-vars */
import '../../_support/env';
import * as assert from 'assert';
import {Column, DataType, Entity} from '@sqb/connect';

describe('Column()', function () {

    it(`should add column metadata`, () => {
        class MyEntity {
            @Column()
            id: string
        }

        const meta = Entity.getMetadata(MyEntity);
        assert.ok(meta);
        assert.strictEqual(meta.name, 'MyEntity');
        const idColumn = meta.getDataColumn('id');
        assert.ok(idColumn);
        assert.strictEqual(idColumn.name, 'id');
    });

    it(`should set "dataType" if first argument is string`, () => {
        class MyEntity {
            @Column(DataType.VARCHAR)
            id: string
        }

        const meta = Entity.getMetadata(MyEntity);
        assert.ok(meta);
        const idColumn = meta.getDataColumn('id');
        assert.ok(idColumn);
        assert.strictEqual(idColumn.dataType, DataType.VARCHAR);
    });

    it(`should define options with object`, () => {
        class MyEntity {
            @Column({
                type: Number,
                dataType: DataType.NUMBER,
                fieldName: '_id',
                comment: 'comment',
                defaultValue: 123,
                isArray: false,
                collation: 'collation',
                enum: [1, 2, 3],
                length: 5,
                nullable: true,
                precision: 8,
                scale: 2,
                autoGenerate: 'uuid',
                insert: true,
                update: true,
                hidden: false,
                required: false
            })
            id: number
        }

        const meta = Entity.getMetadata(MyEntity);
        assert.ok(meta);
        const idColumn = meta.getDataColumn('id');
        assert.ok(idColumn);
        assert.strictEqual(idColumn.type, Number);
        assert.strictEqual(idColumn.dataType, DataType.NUMBER);
        assert.strictEqual(idColumn.fieldName, '_id');
        assert.strictEqual(idColumn.comment, 'comment');
        assert.strictEqual(idColumn.defaultValue, 123);
        assert.strictEqual(idColumn.isArray, false);
        assert.strictEqual(idColumn.collation, 'collation');
        assert.deepStrictEqual(idColumn.enum, [1, 2, 3]);
        assert.strictEqual(idColumn.length, 5);
        assert.strictEqual(idColumn.nullable, true);
        assert.strictEqual(idColumn.precision, 8);
        assert.strictEqual(idColumn.scale, 2);
        assert.strictEqual(idColumn.autoGenerate, 'uuid');
        assert.strictEqual(idColumn.insert, true);
        assert.strictEqual(idColumn.update, true);
        assert.strictEqual(idColumn.hidden, false);
        assert.strictEqual(idColumn.required, false);
    });

    it(`should determine "type" and "dataType" using reflection`, () => {
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
        let col = meta.getDataColumn('col1');
        assert.strictEqual(col.type, String);
        assert.strictEqual(col.dataType, DataType.VARCHAR);
        col = meta.getDataColumn('col2');
        assert.strictEqual(col.type, Number);
        assert.strictEqual(col.dataType, DataType.NUMBER);
        col = meta.getDataColumn('col3');
        assert.strictEqual(col.type, Boolean);
        assert.strictEqual(col.dataType, DataType.BOOL);
        col = meta.getDataColumn('col4');
        assert.strictEqual(col.type, Date);
        assert.strictEqual(col.dataType, DataType.TIMESTAMP);
        col = meta.getDataColumn('col5');
        assert.strictEqual(col.type, Buffer);
        assert.strictEqual(col.dataType, DataType.BINARY);
        col = meta.getDataColumn('col6');
        assert.strictEqual(col.type, Array);
        assert.strictEqual(col.dataType, DataType.VARCHAR);
    });

});
