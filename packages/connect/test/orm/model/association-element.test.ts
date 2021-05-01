/* eslint-disable */
import '../../_support/env';
import * as assert from 'assert';
import {
    Column,
    Entity,
    Association,
    HasOne,
    PrimaryKey, hasOne, HasMany
} from '@sqb/connect';
import {isAssociationElement} from '@sqb/connect/src/orm/helpers';

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

describe('Association element', function () {

    it(`should @Association() decorator define association element`, function () {

        class Customer extends BaseCustomer {
            @Association(hasOne(Country))
            country: Country;
        }

        const meta = Entity.getMetadata(Customer);
        assert.ok(meta);
        const col = meta.getAssociationElement('country');
        assert.ok(isAssociationElement(col));
        assert.strictEqual(col.name, 'country');
        assert.strictEqual(col.association.source, Customer);
        assert.strictEqual(col.association.target, Country);
        assert.strictEqual(col.association.returnsMany(), false);
    });

    it(`should @HasOne() decorator define association element`, function () {

        class Customer extends BaseCustomer {
            @HasOne(Country)
            country: Country;
        }

        const meta = Entity.getMetadata(Customer);
        assert.ok(meta);
        const col = meta.getAssociationElement('country');
        assert.ok(isAssociationElement(col));
        assert.strictEqual(col.name, 'country');
        assert.strictEqual(col.association.source, Customer);
        assert.strictEqual(col.association.target, Country);
        assert.strictEqual(col.association.returnsMany(), false);
    });

    it(`should @HasOne() determine type from reflection`, function () {

        class Customer extends BaseCustomer {
            @HasOne()
            country: Country;
        }

        const meta = Entity.getMetadata(Customer);
        assert.ok(meta);
        const col = meta.getAssociationElement('country');
        assert.ok(isAssociationElement(col));
        assert.strictEqual(col.name, 'country');
        assert.strictEqual(col.association.source, Customer);
        assert.strictEqual(col.association.target, Country);
    });

    it(`should @HasMany() decorator define association element`, function () {

        class Customer extends BaseCustomer {
            @HasMany(Country)
            countries: Country[];
        }

        const meta = Entity.getMetadata(Customer);
        assert.ok(meta);
        const col = meta.getAssociationElement('countries');
        assert.ok(isAssociationElement(col));
        assert.strictEqual(col.name, 'countries');
        assert.strictEqual(col.association.source, Customer);
        assert.strictEqual(col.association.target, Country);
        assert.strictEqual(col.association.returnsMany(), true);
    });

    it(`should throw if association returns many and property type is not an array`, async function () {

        assert.throws(function () {
            // noinspection JSUnusedLocalSymbols
            class Customer {

                @HasMany(Country)
                countries: Country;
            }
        }, /must be an array/)
    });

});
