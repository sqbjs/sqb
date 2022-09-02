import {
    Column,
    Entity,
    Link, LinkFromMany, linkFromMany,
    LinkToOne, PrimaryKey
} from '@sqb/connect';
import {Continent} from './continent.entity.js';
import type {Customer} from './customer.entity.js';

@Entity('countries')
export class Country {
    @PrimaryKey()
    @Column()
    code: string;

    @Column()
    name: string;

    @Column({fieldName: 'phone_code'})
    phoneCode: string;

    @Column({fieldName: 'continent_code'})
    continentCode: string;

    @Column({fieldName: 'has_market', default: true})
    hasMarket: boolean;

    @LinkToOne(Continent)
    readonly continent: Continent;

    @LinkFromMany(async () => (await import('./customer.entity.js')).Customer)
    readonly customers: Customer[];

    @Link(linkFromMany(async () => (await import('./customer.entity.js')).Customer)
        .where({vip: true}))
    readonly vipCustomers: Customer[];

}
