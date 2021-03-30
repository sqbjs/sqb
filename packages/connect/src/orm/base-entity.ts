import {REPOSITORY_KEY} from './consts';
import type {Repository} from './repository';
import {EntityMeta} from './metadata/entity-meta';
import {PickWritable, Type} from '../types';

export abstract class BaseEntity<T> {
    private [REPOSITORY_KEY]: Repository<any>;

    constructor(partial: Partial<T>) {
        const elements = EntityMeta.getDataColumnNames(Object.getPrototypeOf(this).constructor);
        if (elements && partial) {
            for (const k of elements)
                if (partial[k] !== undefined)
                    this[k] = partial[k];
        }
    }

    async destroy(): Promise<boolean> {
        const repo = this[REPOSITORY_KEY];
        return repo.destroy(this);
    }

    async exists(): Promise<boolean> {
        const repo = this[REPOSITORY_KEY];
        return repo.exists(this);
    }

    toJSON(): any {
        // this method is an placeholder an will be overwritten by declareEntity() method
        return this;
    }
}

export function getElementNames<T, K extends keyof PickWritable<T>>(classRef: Type<T>): K[] {
    return (EntityMeta.getElementNames(classRef) || []) as K[];
}

export function getDataColumnNames<T, K extends keyof PickWritable<T>>(classRef: Type<T>): K[] {
    return (EntityMeta.getDataColumnNames(classRef) || []) as K[];
}

export function getInsertColumnNames<T, K extends keyof PickWritable<T>>(classRef: Type<T>): K[] {
    return (EntityMeta.getInsertColumnNames(classRef) || []) as K[];
}

export function getUpdateColumnNames<T, K extends keyof PickWritable<T>>(classRef: Type<T>): K[] {
    return (EntityMeta.getUpdateColumnNames(classRef) || []) as K[];
}
