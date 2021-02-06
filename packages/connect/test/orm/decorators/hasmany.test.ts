/* eslint-disable @typescript-eslint/unbound-method,@typescript-eslint/no-unused-vars */
import '../../_support/env';
import * as assert from 'assert';
import {Column, Entity, HasMany, LazyResolver} from '@sqb/connect';

describe('HasMany()', function () {

    it(`should define one2many column metadata`, function () {

        class ParentEntity {
            @Column()
            id: number;
        }

        class MyEntity {
            @Column()
            parentId: number

            @HasMany({
                column: 'parentId',
                targetColumn: 'id',
                target: ParentEntity
            })
            parent: ParentEntity[];

            @HasMany({
                column: 'parentId',
                targetColumn: 'id',
                target: ParentEntity,
                lazy: true
            })
            parentLazy: LazyResolver<ParentEntity[]>;
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
        assert.strictEqual(parent.hasMany, true);

        parent = meta.getRelationColumn('parentLazy');
        assert.strictEqual(parent.name, 'parentLazy');
        assert.deepStrictEqual(parent.column, ['parentId']);
        assert.deepStrictEqual(parent.targetColumn, ['id']);
        assert.deepStrictEqual(parent.target, ParentEntity);
        assert.strictEqual(parent.hasMany, true);
        assert.strictEqual(parent.lazy, true);
    });

});
