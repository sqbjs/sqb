import {EntityMeta} from './entity-meta';
import {IndexOptions} from '../types';

export class IndexMeta {
    entity: EntityMeta;
    columns: string[];
    name?: string;
    unique?: boolean;

    constructor(entity: EntityMeta, column: string | string[], options?: IndexOptions) {
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
