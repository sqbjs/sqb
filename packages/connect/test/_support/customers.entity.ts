import {
    DataType,
    BaseEntity, Column, Entity, HasOne, PrimaryKey,
    LazyResolver, AutoGenerated, TransformRead, TransformWrite,
} from '@sqb/connect';
import {Country} from './countries.entity';

const GenderMap = {
    M: 'Male',
    F: 'Female'
}

export class PersonName {
    @Column({fieldName: 'given_name'})
    given?: string;

    @Column({fieldName: 'family_name'})
    family?: string;
}

@Entity('customers')
export class Customer extends BaseEntity<Customer> {
    @PrimaryKey()
    @Column({
        dataType: DataType.BIGINT,
        fieldName: 'ID',
        autoGenerate: 'increment'
    })
    id?: number;

    @Column({fieldName: 'given_name'})
    givenName?: string;

    @Column({fieldName: 'family_name'})
    familyName?: string;

    @Column({
        dataType: DataType.DATE,
        fieldName: 'birth_date'
    })
    birthDate?: Date;

    @Column({
        dataType: DataType.VARCHAR,
        fieldName: 'city'
    })
    city?: string;

    @Column({fieldName: 'country_code'})
    countryCode?: string;

    @Column({
        dataType: DataType.TIMESTAMP,
        fieldName: 'created_at',
        update: false
    })
    @AutoGenerated('timestamp')
    createdAt?: Date;

    @Column({
        dataType: DataType.CHAR,
        fieldName: 'gender'
    })
    @TransformRead((v) => GenderMap[v] || 'Unknown')
    @TransformWrite((v) => ('' + v).charAt(0))
    gender: string;

    @Column({
        dataType: DataType.TIMESTAMP,
        fieldName: 'updated_at', insert: false
    })
    @AutoGenerated('timestamp')
    updatedAt?: Date;

    @HasOne({
        target: Country,
        column: 'countryCode',
        targetColumn: 'code'
    })
    readonly country?: Country;

    @HasOne({
        target: Country,
        column: 'countryCode',
        targetColumn: 'code',
        lazy: true
    })
    readonly countryLazy?: LazyResolver<Country>;

}
