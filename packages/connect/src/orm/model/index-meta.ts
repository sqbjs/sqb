import {IndexOptions} from '../orm.type';
import {EntityModel} from './entity-model';

export class IndexMeta {
    entity: EntityModel;
    columns: string[];
    name?: string;
    unique?: boolean;

    constructor(entity: EntityModel, column: string | string[], options?: IndexOptions) {
        this.entity = entity;
        this.columns = Array.isArray(column) ? column : [column];
        if (options) {
            if (options.name)
                this.name = options.name;
            if (options.unique)
                this.unique = options.unique;
        }
    }

}
