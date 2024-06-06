import { BaseEntity, Column, DataType, Embedded, Entity, Link, Parse, PrimaryKey, Serialize } from '@sqb/connect';
import { Continent } from '../_support/continent.entity.js';
import { Country } from '../_support/country.entity.js';
import { CustomerTag } from '../_support/customer-tag.entity.js';
import { CustomerVip } from '../_support/customer-vip.entity.js';
import { Tag } from '../_support/tags.entity.js';
import { Address } from './address.js';
import { CustomerDetail } from './customer-detail.entity.js';
import { PersonName } from './person-name.type.js';

const GenderMap = {
  M: 'Male',
  F: 'Female',
};

@Entity('customers')
export class Customer extends BaseEntity {
  @PrimaryKey()
  @Column({ fieldName: 'ID', dataType: DataType.BIGINT, autoGenerated: 'increment' })
  id?: number;

  @Column({ fieldName: 'given_name' })
  givenName?: string;

  @Column({ fieldName: 'family_name' })
  familyName?: string;

  @Embedded(PersonName)
  name: PersonName;

  @Column({
    fieldName: 'birth_date',
    dataType: DataType.DATE,
    exclusive: true,
  })
  birthDate?: Date;

  @Column()
  city?: string;

  @Column({ fieldName: 'country_code', notNull: true })
  countryCode?: string;

  @Column({
    fieldName: 'created_at',
    dataType: DataType.TIMESTAMP,
    autoGenerated: 'timestamp',
    noUpdate: true,
  })
  createdAt?: Date;

  @Column(DataType.CHAR)
  @Parse(v => GenderMap[v] || 'Unknown')
  @Serialize(v => ('' + v).charAt(0))
  gender: string;

  @Embedded(Address, { fieldNamePrefix: 'address_' })
  address: Address;

  @Column({
    fieldName: 'updated_at',
    dataType: DataType.TIMESTAMP,
    autoGenerated: 'timestamp',
    noInsert: true,
  })
  updatedAt?: Date;

  @Column({ default: true })
  active: boolean;

  @Column()
  vip: boolean;

  @Column({ fieldName: 'custom_data', dataType: DataType.JSON })
  customData: object;

  @Link({ exclusive: true })
  readonly country?: Country;

  @Link({ exclusive: true }).toOne(CustomerVip, { sourceKey: 'id', targetKey: 'customerId' })
  readonly vipDetails: CustomerVip;

  @Link({ exclusive: true }).toOne(CustomerVip, { sourceKey: 'id', targetKey: 'customerId', where: { 'rank>=': 5 } })
  readonly vvipDetails: CustomerVip;

  @Link({ exclusive: true }).toOne(Country).toOne(Continent)
  readonly continent: Continent;

  @Link({ exclusive: true }).toOne(CustomerDetail, { sourceKey: 'id', targetKey: 'customerId' })
  readonly details: CustomerDetail;

  @Link({ exclusive: true }).toMany(CustomerTag).toOne(Tag)
  readonly tags?: Tag[];
}
