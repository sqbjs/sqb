/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Column, Entity, EntityMetadata, ForeignKey, Index } from '@sqb/connect';

describe('Model / Entity mapping', () => {
  describe('UnionEntity()', () => {
    it(`should combine properties`, () => {
      @Entity()
      class EntityA {
        @Column()
        id: number;
      }

      class EntityB {
        @Column()
        name: string;
      }

      @Entity()
      class NewEntityClass extends Entity.Union(EntityA, EntityB) {}

      const meta = Entity.getMetadata(NewEntityClass);
      expect(meta).toBeDefined();
      expect(meta!.name).toStrictEqual('NewEntityClass');
      expect(EntityMetadata.getField(meta!, 'id')).toBeDefined();
      expect(EntityMetadata.getField(meta!, 'name')).toBeDefined();
    });

    it(`should combine foreign keys`, () => {
      @Entity()
      class EntityA {
        @Column()
        id: number;
      }

      class EntityC {
        @Column()
        id: number;
      }

      class EntityB {
        @Column()
        name: string;

        @Column()
        @ForeignKey(EntityC)
        cId: string;
      }

      @Entity()
      class NewEntityClass extends Entity.Union(EntityA, EntityB) {}

      const meta = Entity.getMetadata(NewEntityClass);
      expect(meta).toBeDefined();
      expect(meta!.name).toStrictEqual('NewEntityClass');
      expect(meta!.foreignKeys.length).toStrictEqual(1);
      expect(meta!.foreignKeys[0].target).toStrictEqual(EntityC);
      expect(meta!.foreignKeys[0].source).toStrictEqual(NewEntityClass);
    });

    it(`should combine indexes`, () => {
      @Entity()
      class EntityA {
        @Column()
        id: number;
      }

      class EntityB {
        @Column()
        @Index()
        name: string;
      }

      @Entity()
      class NewEntityClass extends Entity.Union(EntityA, EntityB) {}

      const meta = Entity.getMetadata(NewEntityClass);
      expect(meta).toBeDefined();
      expect(meta!.name).toStrictEqual('NewEntityClass');
      expect(meta!.indexes.length).toStrictEqual(1);
      expect(meta!.indexes[0].columns).toStrictEqual(['name']);
    });
  });

  describe('Entity.Pick()', () => {
    it(`should pick given properties`, () => {
      @Entity()
      class EntityA {
        @Column()
        id: number;
        @Column()
        name: string;
      }

      @Entity()
      class NewEntityClass extends Entity.Pick(EntityA, ['id']) {}

      const meta = Entity.getMetadata(NewEntityClass);
      expect(meta).toBeDefined();
      expect(meta!.name).toStrictEqual('NewEntityClass');
      expect(EntityMetadata.getField(meta!, 'id')).toBeDefined();
      expect(EntityMetadata.getField(meta!, 'name')).not.toBeDefined();
    });

    it(`should pick foreign keys for only given keys`, () => {
      @Entity()
      class EntityA {
        @Column()
        id: number;
      }

      class EntityB {
        @Column()
        name: string;

        @Column()
        @ForeignKey(EntityA)
        aId1: string;

        @Column()
        @ForeignKey(EntityA)
        aId2: string;
      }

      @Entity()
      class NewEntityClass extends Entity.Pick(EntityB, ['name', 'aId1']) {}

      const meta = Entity.getMetadata(NewEntityClass);
      expect(meta).toBeDefined();
      expect(meta!.name).toStrictEqual('NewEntityClass');
      expect(meta!.foreignKeys.length).toStrictEqual(1);
      expect(meta!.foreignKeys[0].target).toStrictEqual(EntityA);
      expect(meta!.foreignKeys[0].source).toStrictEqual(NewEntityClass);
      expect(meta!.foreignKeys[0].sourceKey).toStrictEqual('aId1');
    });

    it(`should pick indexes for only given keys`, () => {
      @Entity()
      class EntityA {
        @Column()
        @Index()
        id: number;

        @Column()
        @Index()
        name: string;
      }

      @Entity()
      class NewEntityClass extends Entity.Pick(EntityA, ['name']) {}

      const meta = Entity.getMetadata(NewEntityClass);
      expect(meta).toBeDefined();
      expect(meta!.name).toStrictEqual('NewEntityClass');
      expect(meta!.indexes.length).toStrictEqual(1);
      expect(meta!.indexes[0].columns).toStrictEqual(['name']);
    });
  });

  describe('Entity.Omit()', () => {
    it(`should omit given properties`, () => {
      @Entity()
      class EntityA {
        @Column()
        id: number;
        @Column()
        name: string;
      }

      @Entity()
      class NewEntityClass extends Entity.Omit(EntityA, ['id']) {}

      const meta = Entity.getMetadata(NewEntityClass);
      expect(meta).toBeDefined();
      expect(meta!.name).toStrictEqual('NewEntityClass');
      expect(EntityMetadata.getField(meta!, 'id')).not.toBeDefined();
      expect(EntityMetadata.getField(meta!, 'name')).toBeDefined();
    });

    it(`should omit foreign keys for only given keys`, () => {
      @Entity()
      class EntityA {
        @Column()
        id: number;
      }

      class EntityB {
        @Column()
        name: string;

        @Column()
        @ForeignKey(EntityA)
        aId1: string;

        @Column()
        @ForeignKey(EntityA)
        aId2: string;
      }

      @Entity()
      class NewEntityClass extends Entity.Omit(EntityB, ['name', 'aId1']) {}

      const meta = Entity.getMetadata(NewEntityClass);
      expect(meta).toBeDefined();
      expect(meta!.name).toStrictEqual('NewEntityClass');
      expect(meta!.foreignKeys.length).toStrictEqual(1);
      expect(meta!.foreignKeys[0].target).toStrictEqual(EntityA);
      expect(meta!.foreignKeys[0].source).toStrictEqual(NewEntityClass);
      expect(meta!.foreignKeys[0].sourceKey).toStrictEqual('aId2');
    });

    it(`should omit indexes for only given keys`, () => {
      @Entity()
      class EntityA {
        @Column()
        @Index()
        id: number;

        @Column()
        @Index()
        name: string;
      }

      @Entity()
      class NewEntityClass extends Entity.Omit(EntityA, ['name']) {}

      const meta = Entity.getMetadata(NewEntityClass);
      expect(meta).toBeDefined();
      expect(meta!.name).toStrictEqual('NewEntityClass');
      expect(meta!.indexes.length).toStrictEqual(1);
      expect(meta!.indexes[0].columns).toStrictEqual(['id']);
    });
  });
});
