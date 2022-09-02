import {
    Column,
    Entity,
    Link,
    PrimaryKey
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

    @Link({exclusive: true})
    readonly continent: Continent;

    @Link({exclusive: true})
        .toMany(async () => (await import('./customer.entity.js')).Customer,
            {sourceKey: 'code', targetKey: 'countryCode'})
    readonly customers: Customer[];

    @Link({exclusive: true}).toMany(
        async () => (await import('./customer.entity.js')).Customer,
        {sourceKey: 'code', targetKey: 'countryCode', where: {vip: true}}
    )
    readonly vipCustomers: Customer[];

}
