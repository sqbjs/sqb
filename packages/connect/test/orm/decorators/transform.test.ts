/* eslint-disable @typescript-eslint/unbound-method,@typescript-eslint/no-unused-vars */
import '../../_support/env';
import * as assert from 'assert';
import {Entity, Transform} from '@sqb/connect';

describe('Decorators', function () {

    it(`should add column metadata and set "transform" option`, () => {
        const fn = (v) => '>' + v;

        class MyEntity {
            @Transform(fn)
            id: string
        }

        const meta = Entity.getMetadata(MyEntity);
        assert.ok(meta);
        assert.strictEqual(meta.name, 'MyEntity');
        const idColumn = meta.getDataColumn('id');
        assert.ok(idColumn);
        assert.strictEqual(idColumn.transform, fn);
    });

});
