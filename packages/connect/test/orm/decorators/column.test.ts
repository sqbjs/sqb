/* eslint-disable @typescript-eslint/unbound-method,@typescript-eslint/no-unused-vars */
import '../../_support/env';
import * as assert from 'assert';
import {Column, Entity} from '@sqb/connect';

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

    it(`should set "type" if first argument is string`, () => {
        class MyEntity {
            @Column('int')
            id: string
        }

        const meta = Entity.getMetadata(MyEntity);
        assert.ok(meta);
        const idColumn = meta.getDataColumn('id');
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
                required: false,
                sortAscending: true,
                sortDescending: true
            })
            id: string
        }

        const meta = Entity.getMetadata(MyEntity);
        assert.ok(meta);
        const idColumn = meta.getDataColumn('id');
        assert.ok(idColumn);
        assert.strictEqual(idColumn.type, 'number');
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

});
