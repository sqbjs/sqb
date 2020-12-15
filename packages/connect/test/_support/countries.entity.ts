import {Column, Entity, PrimaryKey} from '@sqb/connect';

@Entity({tableName: 'countries'})
export class Country {
    @PrimaryKey()
    @Column()
    code: string;

    @Column()
    name: string;

    @Column({fieldName: 'phone_code'})
    phoneCode: string;

}
