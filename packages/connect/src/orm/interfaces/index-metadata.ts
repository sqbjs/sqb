import {EntityModel} from '../model/entity-model';
import {IndexOptions} from '../orm.type';

export interface IndexMetadata {
    readonly entity: EntityModel;
    columns: string[];
    name?: string;
    unique?: boolean;
}

export namespace IndexMetadata {
    export function create(entity: EntityModel, column: string | string[], options?: IndexOptions) {
        const result: IndexMetadata = {
            entity,
            columns: Array.isArray(column) ? column : [column]
        }
        if (options) {
            if (options.name)
                result.name = options.name;
            if (options.unique)
                result.unique = options.unique;
        }
        return result;
    }
}
