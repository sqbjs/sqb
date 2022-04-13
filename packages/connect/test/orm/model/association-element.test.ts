/* eslint-disable */
import '../../_support/env';
import * as assert from 'assert';
import {
    Column,
    Entity,
    Link,
    LinkToOne,
    PrimaryKey, linkToOne, LinkToMany, EntityMetadata
} from '@sqb/connect';
import {isAssociationElement} from '../../../src/orm/util/orm.helper';

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

describe('Nested element', function () {

    it(`should @Nested() decorator define association element`, function () {

        class Customer extends BaseCustomer {
            @Link(linkToOne(Country))
            country: Country;
        }

        const meta = Entity.getMetadata(Customer);
        assert.ok(meta);
        const col = EntityMetadata.getAssociationElement(meta, 'country');
        assert.ok(isAssociationElement(col));
        assert.strictEqual(col.name, 'country');
        assert.strictEqual(col.association.source, Customer);
        assert.strictEqual(col.association.target, Country);
        assert.strictEqual(col.association.returnsMany(), false);
    });

    it(`should @HasOne() decorator define association element`, function () {

        class Customer extends BaseCustomer {
            @LinkToOne(Country)
            country: Country;
        }

        const meta = Entity.getMetadata(Customer);
        assert.ok(meta);
        const col = EntityMetadata.getAssociationElement(meta, 'country');
        assert.ok(isAssociationElement(col));
        assert.strictEqual(col.name, 'country');
        assert.strictEqual(col.association.source, Customer);
        assert.strictEqual(col.association.target, Country);
        assert.strictEqual(col.association.returnsMany(), false);
    });

    it(`should @HasOne() determine type from reflection`, function () {

        class Customer extends BaseCustomer {
            @LinkToOne()
            country: Country;
        }

        const meta = Entity.getMetadata(Customer);
        assert.ok(meta);
        const col = EntityMetadata.getAssociationElement(meta, 'country');
        assert.ok(isAssociationElement(col));
        assert.strictEqual(col.name, 'country');
        assert.strictEqual(col.association.source, Customer);
        assert.strictEqual(col.association.target, Country);
    });

    it(`should @HasMany() decorator define association element`, function () {

        class Customer extends BaseCustomer {
            @LinkToMany(Country)
            countries: Country[];
        }

        const meta = Entity.getMetadata(Customer);
        assert.ok(meta);
        const col = EntityMetadata.getAssociationElement(meta, 'countries');
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

                @LinkToMany(Country)
                countries: Country;
            }
        }, /must be an array/)
    });

});
