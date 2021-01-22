import {Column, Entity, PrimaryKey} from '@sqb/connect';

@Entity({tableName: 'continents'})
export class Continent {
    @PrimaryKey()
    @Column()
    code: string;

    @Column()
    name: string;

}
