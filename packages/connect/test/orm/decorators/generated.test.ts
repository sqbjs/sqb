/* eslint-disable @typescript-eslint/unbound-method,@typescript-eslint/no-unused-vars */
import '../../_support/env';
import * as assert from 'assert';
import {Entity, Sort} from '@sqb/connect';

describe('Sort()', function () {

    it(`should set sortAscending to true if no direction given`, () => {
        class MyEntity {
            @Sort()
            id: string
        }

        const meta = Entity.getMetadata(MyEntity);
        assert.ok(meta);
        assert.strictEqual(meta.name, 'MyEntity');
        const idColumn = meta.getDataColumn('id');
        assert.ok(idColumn);
        assert.strictEqual(idColumn.sortAscending, true);
        assert.strictEqual(idColumn.sortDescending, false);
    });

    it(`should set sortAscending to true if given direction is "ascending"`, () => {
        class MyEntity {
            @Sort('ascending')
            id: string
        }

        const meta = Entity.getMetadata(MyEntity);
        assert.ok(meta);
        assert.strictEqual(meta.name, 'MyEntity');
        const idColumn = meta.getDataColumn('id');
        assert.ok(idColumn);
        assert.strictEqual(idColumn.sortAscending, true);
        assert.strictEqual(idColumn.sortDescending, false);
    });

    it(`should set sortDescending to true if given direction is "descending"`, () => {
        class MyEntity {
            @Sort('descending')
            id: string
        }

        const meta = Entity.getMetadata(MyEntity);
        assert.ok(meta);
        assert.strictEqual(meta.name, 'MyEntity');
        const idColumn = meta.getDataColumn('id');
        assert.ok(idColumn);
        assert.strictEqual(idColumn.sortAscending, false);
        assert.strictEqual(idColumn.sortDescending, true);
    });

    it(`should set sortAscending and sortDescending to true if given direction is "both"`, () => {
        class MyEntity {
            @Sort('both')
            id: string
        }

        const meta = Entity.getMetadata(MyEntity);
        assert.ok(meta);
        assert.strictEqual(meta.name, 'MyEntity');
        const idColumn = meta.getDataColumn('id');
        assert.ok(idColumn);
        assert.strictEqual(idColumn.sortAscending, true);
        assert.strictEqual(idColumn.sortDescending, true);
    });

});
