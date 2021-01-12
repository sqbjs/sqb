import {Column, Entity, PrimaryKey, Sort} from '@sqb/connect';

@Entity({tableName: 'continents'})
export class Continent {
    @PrimaryKey()
    @Column()
    @Sort()
    code: string;

    @Column()
    @Sort()
    name: string;

}
