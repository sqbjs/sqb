import {BASE_ENTITY_REPOSITORY_KEY, ENTITY_DEFINITION_PROPERTY} from './consts';
import type {Repository} from './Repository';
import type {EntityDefinition} from './EntityDefinition';

export abstract class BaseEntity<T> {
    static [ENTITY_DEFINITION_PROPERTY]: EntityDefinition;
    [BASE_ENTITY_REPOSITORY_KEY]: Repository<any>;

    constructor(partial: Partial<T>) {
        Object.assign(this, partial);
    }

    async destroy(): Promise<boolean> {
        const repo = this[BASE_ENTITY_REPOSITORY_KEY];
        return repo.destroy(this);
    }

    toJSON(): any {
        // this method is an placeholder an will be overwritten by declareEntity() method
        return this;
    }

}
