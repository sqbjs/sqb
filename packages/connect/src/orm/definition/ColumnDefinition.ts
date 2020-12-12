import {EntityDefinition} from './EntityDefinition';
import {AutoGenerationStrategy} from '../types';

export class ColumnDefinition {

    readonly name: string;
    type: string;
    fieldName: string;
    comment?: string;
    defaultValue: any;
    array?: boolean;
    collation?: string;
    enum?: (string | number)[] | Object;
    length?: number;
    nullable?: boolean;
    precision?: number;
    scale?: number;
    autoGenerate?: AutoGenerationStrategy;
    sortAscending?: boolean;
    sortDescending?: boolean;

    constructor(readonly entity: EntityDefinition, name: string) {
        this.name = name;
        this.fieldName = name;
        this.type = 'string';
    }

}
