import {BASE_ENTITY_REPOSITORY_KEY} from './consts';
import type {Repository} from './Repository';
import {EntityDefinition} from '@sqb/connect/src';

export abstract class BaseEntity<T extends BaseEntity<any>> {
    private [BASE_ENTITY_REPOSITORY_KEY]: Repository<any>;

    constructor(partial: Partial<T>) {
        const elements = EntityDefinition.getOwnElementNames(Object.getPrototypeOf(this).constructor);
        if (elements) {
            for (const k of elements)
                if (partial[k] !== undefined)
                    this[k] = partial[k];
        }
    }

    async destroy(): Promise<boolean> {
        const repo = this[BASE_ENTITY_REPOSITORY_KEY];
        return repo.destroy(this);
    }

    toJSON(): any {
        // this method is an placeholder an will be overwritten by declareEntity() method
        return this;
    }

    static getElementNames<TT extends BaseEntity<any>, K extends keyof TT>(): K[] {
        return (EntityDefinition.getElementNames(this) || []) as K[];
    }

    static getOwnElementNames<TT extends BaseEntity<any>, K extends keyof TT>(): K[] {
        return (EntityDefinition.getOwnElementNames(this) || []) as K[];
    }

}
