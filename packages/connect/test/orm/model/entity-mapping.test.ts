/* eslint-disable @typescript-eslint/unbound-method,@typescript-eslint/no-unused-vars */
import '../../_support/env';
import * as assert from 'assert';
import {
    Column,
    Entity, EntityMetadata,
    ForeignKey, Index
} from '@sqb/connect';

describe('Entity mapping', function () {

    describe('UnionEntity()', function () {

        it(`should combine properties`, () => {
            @Entity()
            class EntityA {
                @Column()
                id: number
            }

            class EntityB {
                @Column()
                name: string
            }

            @Entity()
            class NewEntityClass extends Entity.Union(EntityA, EntityB) {
            }

            const meta = Entity.getMetadata(NewEntityClass);
            assert.ok(meta);
            assert.strictEqual(meta.name, 'NewEntityClass');
            assert.ok(EntityMetadata.getElement(meta, 'id'));
            assert.ok(EntityMetadata.getElement(meta, 'name'));
        });

        it(`should combine foreign keys`, () => {
            @Entity()
            class EntityA {
                @Column()
                id: number
            }

            class EntityC {
                @Column()
                id: number
            }

            class EntityB {
                @Column()
                name: string

                @Column()
                @ForeignKey(EntityC)
                cId: string
            }

            @Entity()
            class NewEntityClass extends Entity.Union(EntityA, EntityB) {
            }

            const meta = Entity.getMetadata(NewEntityClass);
            assert.ok(meta);
            assert.strictEqual(meta.name, 'NewEntityClass');
            assert.strictEqual(meta.foreignKeys.length, 1);
            assert.strictEqual(meta.foreignKeys[0].target, EntityC);
            assert.strictEqual(meta.foreignKeys[0].source, NewEntityClass);
        });

        it(`should combine indexes`, () => {
            @Entity()
            class EntityA {
                @Column()
                id: number
            }

            class EntityB {
                @Column()
                @Index()
                name: string

            }

            @Entity()
            class NewEntityClass extends Entity.Union(EntityA, EntityB) {
            }

            const meta = Entity.getMetadata(NewEntityClass);
            assert.ok(meta);
            assert.strictEqual(meta.name, 'NewEntityClass');
            assert.strictEqual(meta.indexes.length, 1);
            assert.deepStrictEqual(meta.indexes[0].columns, ['name']);
        });
    })

    describe('Entity.Pick()', function () {

        it(`should pick given properties`, () => {
            @Entity()
            class EntityA {
                @Column()
                id: number
                @Column()
                name: string
            }

            @Entity()
            class NewEntityClass extends Entity.Pick(EntityA, ['id']) {
            }

            const meta = Entity.getMetadata(NewEntityClass);
            assert.ok(meta);
            assert.strictEqual(meta.name, 'NewEntityClass');
            assert.ok(EntityMetadata.getElement(meta, 'id'));
            assert.ok(!EntityMetadata.getElement(meta, 'name'));
        });

        it(`should pick foreign keys for only given keys`, () => {
            @Entity()
            class EntityA {
                @Column()
                id: number
            }

            class EntityB {
                @Column()
                name: string

                @Column()
                @ForeignKey(EntityA)
                aId1: string

                @Column()
                @ForeignKey(EntityA)
                aId2: string
            }

            @Entity()
            class NewEntityClass extends Entity.Pick(EntityB, ['name', 'aId1']) {
            }

            const meta = Entity.getMetadata(NewEntityClass);
            assert.ok(meta);
            assert.strictEqual(meta.name, 'NewEntityClass');
            assert.strictEqual(meta.foreignKeys.length, 1);
            assert.strictEqual(meta.foreignKeys[0].target, EntityA);
            assert.strictEqual(meta.foreignKeys[0].source, NewEntityClass);
            assert.strictEqual(meta.foreignKeys[0].sourceKey, 'aId1');
        });

        it(`should pick indexes for only given keys`, () => {
            @Entity()
            class EntityA {
                @Column()
                @Index()
                id: number

                @Column()
                @Index()
                name: string
            }

            @Entity()
            class NewEntityClass extends Entity.Pick(EntityA, ['name']) {
            }

            const meta = Entity.getMetadata(NewEntityClass);
            assert.ok(meta);
            assert.strictEqual(meta.name, 'NewEntityClass');
            assert.strictEqual(meta.indexes.length, 1);
            assert.deepStrictEqual(meta.indexes[0].columns, ['name']);
        });

    })

    describe('Entity.Omit()', function () {

        it(`should omit given properties`, () => {
            @Entity()
            class EntityA {
                @Column()
                id: number
                @Column()
                name: string
            }

            @Entity()
            class NewEntityClass extends Entity.Omit(EntityA, ['id']) {
            }

            const meta = Entity.getMetadata(NewEntityClass);
            assert.ok(meta);
            assert.strictEqual(meta.name, 'NewEntityClass');
            assert.ok(!EntityMetadata.getElement(meta, 'id'));
            assert.ok(EntityMetadata.getElement(meta, 'name'));
        });

        it(`should omit foreign keys for only given keys`, () => {
            @Entity()
            class EntityA {
                @Column()
                id: number
            }

            class EntityB {
                @Column()
                name: string

                @Column()
                @ForeignKey(EntityA)
                aId1: string

                @Column()
                @ForeignKey(EntityA)
                aId2: string
            }

            @Entity()
            class NewEntityClass extends Entity.Omit(EntityB, ['name', 'aId1']) {
            }

            const meta = Entity.getMetadata(NewEntityClass);
            assert.ok(meta);
            assert.strictEqual(meta.name, 'NewEntityClass');
            assert.strictEqual(meta.foreignKeys.length, 1);
            assert.strictEqual(meta.foreignKeys[0].target, EntityA);
            assert.strictEqual(meta.foreignKeys[0].source, NewEntityClass);
            assert.strictEqual(meta.foreignKeys[0].sourceKey, 'aId2');
        });

        it(`should omit indexes for only given keys`, () => {
            @Entity()
            class EntityA {
                @Column()
                @Index()
                id: number

                @Column()
                @Index()
                name: string
            }

            @Entity()
            class NewEntityClass extends Entity.Omit(EntityA, ['name']) {
            }

            const meta = Entity.getMetadata(NewEntityClass);
            assert.ok(meta);
            assert.strictEqual(meta.name, 'NewEntityClass');
            assert.strictEqual(meta.indexes.length, 1);
            assert.deepStrictEqual(meta.indexes[0].columns, ['id']);
        });

    })


});
