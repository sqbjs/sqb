import {
    Column,
    Entity,
    PrimaryKey,
    FieldName,
    ForeignKey, HasOne, HasMany
} from '@sqb/connect';
import {Continent} from './continents.entity';
import type {Customer} from './customers.entity';

@Entity('countries')
export class Country {
    @PrimaryKey()
    @Column()
    code: string;

    @Column()
    name: string;

    @Column()
    @FieldName('phone_code')
    phoneCode: string;

    @Column()
    @FieldName('continent_code')
    @ForeignKey(Continent)
    continentCode: string;

    @HasOne()
    readonly continent: Continent;

    @HasMany(async () => (await import('./customers.entity')).Customer)
    readonly customers: Customer[];


}
