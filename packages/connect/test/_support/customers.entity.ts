import {Column, Entity, PrimaryKey, SortAscending, SortDescending, RelationColumn} from '@sqb/connect';
import {Country} from './countries.entity';

@Entity('customers')
export class Customer {
    @PrimaryKey()
    @Column({fieldName: 'ID'})
    @SortDescending()
    id: number;

    @Column({fieldName: 'given_name'})
    @SortAscending()
    @SortDescending()
    givenName: string;

    @Column({
        fieldName: 'family_name',
        sortAscending: true,
        sortDescending: true
    })
    familyName: string;

    @SortDescending()
    @Column({fieldName: 'birth_date'})
    birthDate: Date;

    @Column({fieldName: 'city'})
    city: string;

    @Column({fieldName: 'country_code'})
    countryCode: string;

    @RelationColumn({
        target: Country,
        column: 'countryCode',
        targetColumn: 'code'
    })
    readonly country: Country;

}
