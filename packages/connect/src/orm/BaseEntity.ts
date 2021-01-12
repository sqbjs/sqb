import {BASE_ENTITY_REPOSITORY_KEY, ENTITY_DEFINITION_PROPERTY} from './consts';
import type {Repository} from './Repository';
import type {EntityDefinition} from './EntityDefinition';

export class BaseEntity {
    static [ENTITY_DEFINITION_PROPERTY]: EntityDefinition;
    [BASE_ENTITY_REPOSITORY_KEY]: Repository<any>;

    async destroy(): Promise<boolean> {
        const repo = this[BASE_ENTITY_REPOSITORY_KEY];
        return repo.destroy(this);
    }

}
