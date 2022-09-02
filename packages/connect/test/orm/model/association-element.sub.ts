/* eslint-disable @typescript-eslint/no-non-null-assertion,@typescript-eslint/no-unused-vars */
// noinspection JSUnusedLocalSymbols

import {
    Column,
    Entity,
    EntityMetadata,
    Link,
    LinkToMany, LinkToOne,
    linkToOne, PrimaryKey
} from '@sqb/connect';
import {isAssociationField} from '../../../src/orm/util/orm.helper.js';

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
        expect(meta).toBeDefined();
        const col = EntityMetadata.getAssociationField(meta!, 'country');
        expect(isAssociationField(col)).toBeDefined();
        expect(col!.name).toStrictEqual('country');
        expect(col!.association.source).toStrictEqual(Customer);
        expect(col!.association.target).toStrictEqual(Country);
        expect(col!.association.returnsMany()).toStrictEqual(false);
    });

    it(`should @HasOne() decorator define association element`, function () {

        class Customer extends BaseCustomer {
            @LinkToOne(Country)
            country: Country;
        }

        const meta = Entity.getMetadata(Customer);
        expect(meta).toBeDefined();
        const col = EntityMetadata.getAssociationField(meta!, 'country');
        expect(isAssociationField(col)).toBeTruthy();
        expect(col!.name).toStrictEqual('country');
        expect(col!.association.source).toStrictEqual(Customer);
        expect(col!.association.target).toStrictEqual(Country);
        expect(col!.association.returnsMany()).toStrictEqual(false);
    });

    it(`should @HasOne() determine type from reflection`, function () {

        class Customer extends BaseCustomer {
            @LinkToOne()
            country: Country;
        }

        const meta = Entity.getMetadata(Customer);
        expect(meta).toBeDefined();
        const col = EntityMetadata.getAssociationField(meta!, 'country');
        expect(isAssociationField(col)).toBeTruthy();
        expect(col!.name).toStrictEqual('country');
        expect(col!.association.source).toStrictEqual(Customer);
        expect(col!.association.target).toStrictEqual(Country);
    });

    it(`should @HasMany() decorator define association element`, function () {

        class Customer extends BaseCustomer {
            @LinkToMany(Country)
            countries: Country[];
        }

        const meta = Entity.getMetadata(Customer);
        expect(meta).toBeDefined();
        const col = EntityMetadata.getAssociationField(meta!, 'countries');
        expect(isAssociationField(col)).toBeTruthy();
        expect(col!.name).toStrictEqual('countries');
        expect(col!.association.source).toStrictEqual(Customer);
        expect(col!.association.target).toStrictEqual(Country);
        expect(col!.association.returnsMany()).toStrictEqual(true);
    });

    it(`should throw if association returns many and property type is not an array`, async function () {

        expect(() => {
            class Customer {
                @LinkToMany(Country)
                countries: Country;
            }
        }).toThrow('must be an array')
    });

});
