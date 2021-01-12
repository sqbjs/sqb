import {Column, Entity, PrimaryKey, LazyResolver, HasOne, HasMany, Sort} from '@sqb/connect';
import {Continent} from './continents.entity';
import type {Customer} from './customers.entity';

@Entity({tableName: 'countries'})
export class Country {
    @PrimaryKey()
    @Column()
    @Sort()
    code: string;

    @Column()
    @Sort()
    name: string;

    @Column({fieldName: 'phone_code'})
    phoneCode: string;

    @Column({fieldName: 'continent_code'})
    @Sort()
    continentCode: string;

    @HasOne({
        target: Continent,
        column: 'continentCode',
        targetColumn: 'code'
    })
    readonly continent: Continent;

    @HasOne({
        target: Continent,
        column: 'continentCode',
        targetColumn: 'code',
        lazy: true
    })
    readonly continentLazy: LazyResolver<Continent>;

    @HasMany({
        target: async () => (await import('./customers.entity')).Customer,
        column: 'code',
        targetColumn: 'countryCode'
    })
    readonly customers: Customer[];

    @HasMany({
        target: async () => (await import('./customers.entity')).Customer,
        column: 'code',
        targetColumn: 'countryCode',
        lazy: true
    })
    readonly customersLazy: LazyResolver<Customer[]>;

}
