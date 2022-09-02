import {Column, Entity, Link, PrimaryKey} from '@sqb/connect';
import type {Country} from './country.entity.js';
import type {Customer} from './customer.entity.js';

@Entity('continents')
export class Continent {
    @PrimaryKey()
    @Column()
    code: string;

    @Column()
    name: string;

    @Link({exclusive: true})
        .toMany(async () => (await import('./country.entity.js')).Country,
            {sourceKey: 'code', targetKey: 'continentCode'})
    countries: Country[];

    @Link({exclusive: true})
        .toMany(async () => (await import('./country.entity.js')).Country,
            {sourceKey: 'code', targetKey: 'continentCode', where: {hasMarket: true}})
    marketCountries: Country[];

    @Link({exclusive: true})
        .toMany(
            async () => (await import('./country.entity.js')).Country,
            {sourceKey: 'code', targetKey: 'continentCode'})
        .toOne(
            async () => (await import('./customer.entity.js')).Customer,
            {sourceKey: 'code', targetKey: 'countryCode'}
        )
    customers: Customer[]

}
