import {Column, Entity, Link, LinkFromMany, linkFromOne, PrimaryKey} from '@sqb/connect';
import type {Country} from './country.entity.js';
import type {Customer} from './customer.entity.js';

@Entity('continents')
export class Continent {
    @PrimaryKey()
    @Column()
    code: string;

    @Column()
    name: string;

    @LinkFromMany(() => require('./country.entity.js').Country)
    countries: Country[];

    @Link(linkFromOne(() => require('./country.entity.js').Country)
        .where({hasMarket: true}))
    marketCountries: Country[];

    @Link(linkFromOne(() => require('./country.entity.js').Country)
        .linkFromMany(() => require('./customer.entity.js').Customer))
    customers: Customer[]

}
