/* eslint-disable @typescript-eslint/unbound-method,@typescript-eslint/no-unused-vars */
import '../../_support/env';
import * as assert from 'assert';
import {
    Column,
    Entity,
    HasMany,
    HasManyLazy,
    HasOne,
    HasOneLazy,
    LazyResolver,
    PrimaryKey
} from '@sqb/connect';

class Country {
    @PrimaryKey()
    @Column()
    code: string;

    @Column()
    name: string;
}

class BaseCustomer {
    @PrimaryKey()
    @Column()
    id: number;

    @Column()
    countryCode: string;
}

describe('Relation column', function () {

    it(`should @HasOne() decorator define relation column`, function () {

        class Customer extends BaseCustomer {
            @HasOne(Country, {
                keyColumn: 'countryCode',
                targetColumn: 'code'
            })
            country: Country;
        }

        const meta = Entity.getMetadata(Customer);
        assert.ok(meta);
        const col = meta.getRelationColumn('country');
        assert.ok(col);
        assert.strictEqual(col.name, 'country');
        assert.strictEqual(col.keyColumn, 'countryCode');
        assert.strictEqual(col.targetColumn, 'code');
        assert.strictEqual(col.target, Country);
        assert.strictEqual(col.hasMany, false);
        assert.strictEqual(col.lazy, false);
    });

    it(`should @HasOneLazy() decorator define relation column`, function () {

        class Customer extends BaseCustomer {
            @HasOneLazy(Country, {
                keyColumn: 'countryCode',
                targetColumn: 'code'
            })
            country: LazyResolver<Country>;
        }

        const meta = Entity.getMetadata(Customer);
        assert.ok(meta);
        const col = meta.getRelationColumn('country');
        assert.ok(col);
        assert.strictEqual(col.name, 'country');
        assert.strictEqual(col.keyColumn, 'countryCode');
        assert.strictEqual(col.targetColumn, 'code');
        assert.strictEqual(col.target, Country);
        assert.strictEqual(col.hasMany, false);
        assert.strictEqual(col.lazy, true);
    });

    it(`should @HasMany() decorator define relation column`, function () {

        class Customer extends BaseCustomer {
            @HasMany(Country, {
                keyColumn: 'countryCode',
                targetColumn: 'code'
            })
            country: Country[];
        }

        const meta = Entity.getMetadata(Customer);
        assert.ok(meta);
        const col = meta.getRelationColumn('country');
        assert.ok(col);
        assert.strictEqual(col.name, 'country');
        assert.strictEqual(col.keyColumn, 'countryCode');
        assert.strictEqual(col.targetColumn, 'code');
        assert.strictEqual(col.target, Country);
        assert.strictEqual(col.hasMany, true);
        assert.strictEqual(col.lazy, false);
    });

    it(`should @HasManyLazy() decorator define relation column`, function () {

        class Customer extends BaseCustomer {
            @HasManyLazy(Country, {
                keyColumn: 'countryCode',
                targetColumn: 'code'
            })
            countries: LazyResolver<Country[]>;
        }

        const meta = Entity.getMetadata(Customer);
        assert.ok(meta);
        const col = meta.getRelationColumn('countries');
        assert.ok(col);
        assert.strictEqual(col.name, 'countries');
        assert.strictEqual(col.keyColumn, 'countryCode');
        assert.strictEqual(col.targetColumn, 'code');
        assert.strictEqual(col.target, Country);
        assert.strictEqual(col.hasMany, true);
        assert.strictEqual(col.lazy, true);
    });

    it(`should provide target entity type`, async function () {

        assert.throws(function () {
            class Customer {
                // @ts-ignore
                @HasMany()
                countries: Country;
            }
        }, /You must provide target entity/)
    });

    it(`should throw if property type is not an array (Not Lazy)`, async function () {

        assert.throws(function () {
            class Customer {

                @HasMany(Country)
                countries: Country;
            }
        }, /must be an array/)
    });

    it(`should throw if property type is not an Function (Lazy)`, async function () {

        assert.throws(function () {
            class Customer {

                @HasManyLazy(Country)
                countries: Country;
            }
        }, /must be a Function/)
    });

});
