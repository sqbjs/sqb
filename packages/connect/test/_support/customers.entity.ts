import {Column, Entity, PrimaryKey, SortAscending, SortDescending} from '@sqb/connect';

@Entity()
export class Customers {
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

    @Column({fieldName: 'country'})
    country: string;

}
