/* eslint-disable @typescript-eslint/unbound-method,@typescript-eslint/no-unused-vars */
import '../_support/env';
import * as assert from 'assert';
import {BaseEntity, Column, Entity, HasOne} from '@sqb/connect';

describe('EntityDefinition', function () {

    @Entity()
    class Country extends BaseEntity<MyEntity> {
        @Column()
        code: string;

    }

    @Entity()
    class MyEntity extends BaseEntity<MyEntity> {

        @Column({update: false})
        p1: string;

        @Column({insert: false})
        p2: number;

        @HasOne({
            target: Country,
            targetColumn: ['code'],
            column: 'countryId'
        })
        p3: Country;

    }

    it(`should getColumnNames() return all column names`, () => {
        assert.deepStrictEqual(MyEntity.getColumnNames(), ['p1', 'p2', 'p3']);
    });

    it(`should getOwnColumnNames() return only own column names`, () => {
        assert.deepStrictEqual(MyEntity.getOwnColumnNames(), ['p1', 'p2']);
    });

    it(`should getInsertColumnNames() return only insertable column names`, () => {
        assert.deepStrictEqual(MyEntity.getInsertColumnNames(), ['p1']);
    });

    it(`should getUpdateColumnNames() return only updatable column names`, () => {
        assert.deepStrictEqual(MyEntity.getUpdateColumnNames(), ['p2']);
    });

});
