/* eslint-disable @typescript-eslint/unbound-method,@typescript-eslint/no-unused-vars */
import '../../_support/env';
import * as assert from 'assert';
import {Entity, Parse, Serialize} from '@sqb/connect';

describe('Parse', function () {

    it(`should @Parse() decorator set "parse" property of metadata`, () => {
        const fn = (v) => '>' + v;

        class MyEntity {
            @Parse(fn)
            id: string
        }

        const meta = Entity.getMetadata(MyEntity);
        assert.ok(meta);
        assert.strictEqual(meta.name, 'MyEntity');
        const idColumn = meta.getDataColumn('id');
        assert.ok(idColumn);
        assert.strictEqual(idColumn.parse, fn);
    });

});

describe('Serialize', function () {

    it(`should @Serialize() decorator set "parse" property of metadata`, () => {
        const fn = (v) => '>' + v;

        class MyEntity {
            @Serialize(fn)
            id: string
        }

        const meta = Entity.getMetadata(MyEntity);
        assert.ok(meta);
        assert.strictEqual(meta.name, 'MyEntity');
        const idColumn = meta.getDataColumn('id');
        assert.ok(idColumn);
        assert.strictEqual(idColumn.serialize, fn);
    });

});
