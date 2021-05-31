import {
    Column,
    Entity,
    PrimaryKey,
    LinkToOne, LinkFromMany, Link, linkFromMany
} from '@sqb/connect';
import {Continent} from './continent.entity';
import type {Customer} from './customer.entity';

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

    @LinkFromMany(() => require('./customer.entity').Customer)
    readonly customers: Customer[];

    @Link(linkFromMany(() => require('./customer.entity').Customer)
        .where({vip: true}))
    readonly vipCustomers: Customer[];

}
