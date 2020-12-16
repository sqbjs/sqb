import {Column, Entity, PrimaryKey} from '@sqb/connect';
import {HasOne} from '../../src/orm/decorators/relations.decorator';
import {Continent} from './continents.entity';

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

    @HasOne({
        target: Continent,
        column: 'continentCode',
        targetColumn: 'code'
    })
    continent: Continent

}
