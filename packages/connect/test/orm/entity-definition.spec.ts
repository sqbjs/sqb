/* eslint-disable @typescript-eslint/unbound-method,@typescript-eslint/no-unused-vars */
import '../_support/env';
import * as assert from 'assert';
import {BaseEntity, Column, Entity, HasOne} from '@sqb/connect';

describe('EntityDefinition', function () {

    it(`should override toJSON prototype method`, () => {
        @Entity()
        class Country extends BaseEntity<MyEntity> {
            @Column()
            code: string;

        }

        @Entity()
        class MyEntity extends BaseEntity<MyEntity> {

            @Column()
            p1: string;

            @Column()
            p2: number;

            @HasOne({
                target: Country,
                targetColumn: ['code'],
                column: 'countryId'
            })
            p3: Country;

        }

        assert.deepStrictEqual(MyEntity.getElementNames(), ['p1', 'p2', 'p3']);
        assert.deepStrictEqual(MyEntity.getOwnElementNames(), ['p1', 'p2']);
    });

});
