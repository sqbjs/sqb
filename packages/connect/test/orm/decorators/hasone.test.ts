/* eslint-disable @typescript-eslint/unbound-method,@typescript-eslint/no-unused-vars */
import '../../_support/env';
import * as assert from 'assert';
import {Column, DataType, Entity, HasOne, LazyResolver} from '@sqb/connect';

describe('HasOne()', function () {

    it(`should define one2one column metadata`, function () {

        class ParentEntity {
            @Column()
            id: number;
        }

        class MyEntity {
            @Column()
            parentId: number

            @HasOne({
                column: 'parentId',
                targetColumn: 'id',
                target: ParentEntity
            })
            parent: ParentEntity;

            @HasOne({
                column: 'parentId',
                targetColumn: 'id',
                target: ParentEntity,
                lazy: true
            })
            parentLazy: LazyResolver<ParentEntity>;
        }

        const meta = Entity.getMetadata(MyEntity);
        assert.ok(meta);
        assert.strictEqual(meta.name, 'MyEntity');
        let parent = meta.getRelationColumn('parent');
        assert.ok(parent);
        assert.strictEqual(parent.name, 'parent');
        assert.deepStrictEqual(parent.column, ['parentId']);
        assert.deepStrictEqual(parent.targetColumn, ['id']);
        assert.strictEqual(parent.target, ParentEntity);
        assert.strictEqual(parent.hasMany, false);

        parent = meta.getRelationColumn('parentLazy');
        assert.strictEqual(parent.name, 'parentLazy');
        assert.deepStrictEqual(parent.column, ['parentId']);
        assert.deepStrictEqual(parent.targetColumn, ['id']);
        assert.deepStrictEqual(parent.target, ParentEntity);
        assert.strictEqual(parent.hasMany, false);
        assert.strictEqual(parent.lazy, true);
    });

});
