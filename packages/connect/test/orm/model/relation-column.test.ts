/* eslint-disable */
import '../../_support/env';
import * as assert from 'assert';
import {
    Column,
    Entity,
    HasMany,
    HasManyLazy,
    HasOne,
    HasOneLazy,
    LazyResolver, EntityChain,
    PrimaryKey
} from '@sqb/connect';
import {isRelationElement} from '@sqb/connect/src/orm/helpers';

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
            @HasOne(Country)
            country: Country;
        }

        const meta = Entity.getMetadata(Customer);
        assert.ok(meta);
        const col = meta.getRelationElement('country');
        assert.ok(isRelationElement(col));
        assert.strictEqual(col.name, 'country');
        assert.strictEqual(col.chain.source, Customer);
        assert.strictEqual(col.chain.target, Country);
        assert.strictEqual(col.hasMany, false);
        assert.strictEqual(col.lazy, false);
    });

    it(`should @HasOne() accept EntityLink`, function () {

        class Customer extends BaseCustomer {
            @HasOne(EntityChain(Country).link('code', 'countryCode'))
            country: Country;
        }

        const meta = Entity.getMetadata(Customer);
        assert.ok(meta);
        const col = meta.getRelationElement('country');
        assert.ok(isRelationElement(col));
        assert.strictEqual(col.name, 'country');
        assert.strictEqual(col.chain.source, Customer);
        assert.strictEqual(col.chain.target, Country);
        assert.strictEqual(col.chain.sourceColumn, 'countryCode');
        assert.strictEqual(col.chain.targetColumn, 'code');
        assert.strictEqual(col.hasMany, false);
        assert.strictEqual(col.lazy, false);
    });

    it(`should @HasOneLazy() decorator define relation column`, function () {

        class Customer extends BaseCustomer {
            @HasOneLazy(EntityChain(Country).link('code', 'countryCode'))
            country: LazyResolver<Country>;
        }

        const meta = Entity.getMetadata(Customer);
        assert.ok(meta);
        const col = meta.getRelationElement('country');
        assert.ok(col);
        assert.ok(isRelationElement(col));
        assert.strictEqual(col.name, 'country');
        assert.strictEqual(col.chain.source, Customer);
        assert.strictEqual(col.chain.target, Country);
        assert.strictEqual(col.chain.sourceColumn, 'countryCode');
        assert.strictEqual(col.chain.targetColumn, 'code');
        assert.strictEqual(col.hasMany, false);
        assert.strictEqual(col.lazy, true);
    });

    it(`should @HasMany() decorator define relation column`, function () {

        class Customer extends BaseCustomer {
            @HasMany(EntityChain(Country).link('code', 'countryCode'))
            country: Country[];
        }

        const meta = Entity.getMetadata(Customer);
        assert.ok(meta);
        const col = meta.getRelationElement('country');
        assert.ok(col);
        assert.ok(isRelationElement(col));
        assert.strictEqual(col.name, 'country');
        assert.strictEqual(col.chain.sourceColumn, 'countryCode');
        assert.strictEqual(col.chain.targetColumn, 'code');
        assert.strictEqual(col.chain.target, Country);
        assert.strictEqual(col.hasMany, true);
        assert.strictEqual(col.lazy, false);
    });

    it(`should @HasManyLazy() decorator define relation column`, function () {

        class Customer extends BaseCustomer {
            @HasManyLazy(EntityChain(Country).link('code', 'countryCode'))
            countries: LazyResolver<Country[]>;
        }

        const meta = Entity.getMetadata(Customer);
        assert.ok(meta);
        const col = meta.getRelationElement('countries');
        assert.ok(col);
        assert.ok(isRelationElement(col));
        assert.strictEqual(col.name, 'countries');
        assert.strictEqual(col.chain.sourceColumn, 'countryCode');
        assert.strictEqual(col.chain.targetColumn, 'code');
        assert.strictEqual(col.chain.target, Country);
        assert.strictEqual(col.hasMany, true);
        assert.strictEqual(col.lazy, true);
    });

    it(`should provide target entity type`, async function () {

        assert.throws(function () {
            // noinspection JSUnusedLocalSymbols
            class Customer {
                // @ts-ignore
                @HasMany()
                countries: Country;
            }
        }, /You must provide target entity/)
    });

    it(`should throw if property type is not an array (Not Lazy)`, async function () {

        assert.throws(function () {
            // noinspection JSUnusedLocalSymbols
            class Customer {

                @HasMany(Country)
                countries: Country;
            }
        }, /must be an array/)
    });

    it(`should throw if property type is not an Function (Lazy)`, async function () {

        assert.throws(function () {
            // noinspection JSUnusedLocalSymbols
            class Customer {

                @HasManyLazy(Country)
                countries: Country;
            }
        }, /Function type type required/)
    });

});
