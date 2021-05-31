import {Column, Entity, PrimaryKey, LinkFromMany, Link, linkFromOne} from '@sqb/connect';
import type {Country} from './country.entity';
import type {Customer} from './customer.entity';

@Entity('continents')
export class Continent {
    @PrimaryKey()
    @Column()
    code: string;

    @Column()
    name: string;

    @LinkFromMany(() => require('./country.entity').Country)
    countries: Country[];

    @Link(linkFromOne(() => require('./country.entity').Country)
        .where({hasMarket: true}))
    marketCountries: Country[];

    @Link(linkFromOne(() => require('./country.entity').Country)
        .linkFromMany(() => require('./customer.entity').Customer))
    customers: Customer[]

}
