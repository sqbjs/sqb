import {Column, Entity, PrimaryKey, RelationColumn, LazyResolver} from '@sqb/connect';
import {Continent} from './continents.entity';
import type {Customer} from './customers.entity';

@Entity({tableName: 'countries'})
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

    @RelationColumn({
        target: Continent,
        column: 'continentCode',
        targetColumn: 'code'
    })
    readonly continent: Continent;

    @RelationColumn({
        target: async () => (await import('./customers.entity')).Customer,
        column: 'code',
        targetColumn: 'countryCode',
        hasMany: true
    })
    readonly customers: Customer[]

    @RelationColumn({
        target: async () => (await import('./customers.entity')).Customer,
        column: 'code',
        targetColumn: 'countryCode',
        hasMany: true,
        lazy: true
    })
    readonly customersLazy: LazyResolver<Customer[]>;

}
