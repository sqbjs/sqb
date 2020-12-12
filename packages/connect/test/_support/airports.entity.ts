import {Column, Entity, PrimaryKey} from '@sqb/connect';

@Entity()
export class Airports {
    @PrimaryKey()
    @Column({fieldName: 'ID'})
    id: string;

    @Column({fieldName: 'ShortName'})
    shortName: string;

    @Column({fieldName: 'Name'})
    name: string;

    @Column({fieldName: 'Region'})
    region: string;

    @Column({fieldName: 'ICAO'})
    icao: string;

    @Column({fieldName: 'Flags'})
    flags: number;

    @Column({fieldName: 'Catalog'})
    catalog: number;

    @Column({fieldName: 'Length'})
    length: number;

    @Column({fieldName: 'Elevation'})
    elevation: number;

    @Column({fieldName: 'Runway'})
    runway: string;

    @Column({fieldName: 'Frequency'})
    frequency: number;

    @Column({fieldName: 'Latitude'})
    latitude: string;

    @Column({fieldName: 'Longitude'})
    longitude: string;

}
