/* eslint-disable @typescript-eslint/no-non-null-assertion,@typescript-eslint/no-unused-vars */
// noinspection JSUnusedLocalSymbols

import {
  Column,
  Entity,
  EntityMetadata,
  Link,
  PrimaryKey
} from '@sqb/connect';
import { isAssociationField } from '../../../src/orm/util/orm.helper.js';

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

describe('Model / Link field', function () {

  it(`should @Link() decorator define association element`, function () {

    class Customer extends BaseCustomer {
      @Link().toOne(Country)
      country: Country;

      @Link().toMany(Country)
      country2: Country[];
    }

    const meta = Entity.getMetadata(Customer);
    expect(meta).toBeDefined();
    let col = EntityMetadata.getAssociationField(meta!, 'country');
    expect(isAssociationField(col)).toBeTruthy();
    expect(col!.name).toStrictEqual('country');
    expect(col!.association.source).toStrictEqual(Customer);
    expect(col!.association.target).toStrictEqual(Country);
    expect(col!.association.returnsMany()).toStrictEqual(false);
    col = EntityMetadata.getAssociationField(meta!, 'country2');
    expect(isAssociationField(col)).toBeTruthy();
    expect(col!.name).toStrictEqual('country2');
    expect(col!.association.source).toStrictEqual(Customer);
    expect(col!.association.target).toStrictEqual(Country);
    expect(col!.association.returnsMany()).toStrictEqual(true);
  });

  it(`should throw if type is an array an linked entity is not defined`, async function () {
    expect(() => {
      class Customer {
        @Link()
        countries: Country[];
      }
    }).toThrow('type information while')
  });

  it(`should throw if reflection type is not an entity`, async function () {
    expect(() => {
      class Customer {
        @Link()
        countries: String;
      }
    }).toThrow('No entity metadata found')
  });

  it(`should throw if association returns many and property type is not an array`, async function () {
    expect(() => {
      class Customer {
        @Link().toMany(Country)
        countries: Country;
      }
    }).toThrow('Link returns single instance')
  });

  it(`should throw if association returns single and property type is an array`, async function () {
    expect(() => {
      class Customer {
        @Link().toOne(Country)
        countries: Country[];
      }
    }).toThrow('Link returns array of instances')
  });
});
