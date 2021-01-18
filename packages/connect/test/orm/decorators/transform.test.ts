/* eslint-disable @typescript-eslint/unbound-method,@typescript-eslint/no-unused-vars */
import '../../_support/env';
import * as assert from 'assert';
import {Entity, TransformRead, TransformWrite} from '@sqb/connect';

describe('TransformRead()', function () {

    it(`should add column metadata and set "transformRead" option`, () => {
        const fn = (v) => '>' + v;

        class MyEntity {
            @TransformRead(fn)
            id: string
        }

        const meta = Entity.getMetadata(MyEntity);
        assert.ok(meta);
        assert.strictEqual(meta.name, 'MyEntity');
        const idColumn = meta.getDataColumn('id');
        assert.ok(idColumn);
        assert.strictEqual(idColumn.transformRead, fn);
    });

});

describe('TransformWrite()', function () {

    it(`should add column metadata and set "transformWrite" option`, () => {
        const fn = (v) => '>' + v;

        class MyEntity {
            @TransformWrite(fn)
            id: string
        }

        const meta = Entity.getMetadata(MyEntity);
        assert.ok(meta);
        assert.strictEqual(meta.name, 'MyEntity');
        const idColumn = meta.getDataColumn('id');
        assert.ok(idColumn);
        assert.strictEqual(idColumn.transformWrite, fn);
    });

});
