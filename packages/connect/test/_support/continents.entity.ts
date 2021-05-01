import {Column, Entity, PrimaryKey, HasMany} from '@sqb/connect';
import type {Country} from './countries.entity';

@Entity('continents')
export class Continent {
    @PrimaryKey()
    @Column()
    code: string;

    @Column()
    name: string;

    @HasMany(() => require('./countries.entity').Country)
    countries: Country[];

}
