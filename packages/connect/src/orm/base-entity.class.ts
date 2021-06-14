import {REPOSITORY_KEY} from './orm.const';
import type {Repository} from './repository.class';
import {EntityModel} from './model/entity-model';
import {PickWritable, Type} from '../types';

export abstract class BaseEntity<T> {
    private [REPOSITORY_KEY]: Repository<any>;

    constructor(partial: Partial<T>) {
        const elements = EntityModel.getColumnNames(Object.getPrototypeOf(this).constructor);
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
    return (EntityModel.getElementNames(classRef) || []) as K[];
}

export function getDataColumnNames<T, K extends keyof PickWritable<T>>(classRef: Type<T>): K[] {
    return (EntityModel.getColumnNames(classRef) || []) as K[];
}

export function getAssociationElementNames<T, K extends keyof PickWritable<T>>(classRef: Type<T>): K[] {
    return (EntityModel.getAssociationElementNames(classRef) || []) as K[];
}

export function getEmbeddedElementNames<T, K extends keyof PickWritable<T>>(classRef: Type<T>): K[] {
    return (EntityModel.getEmbeddedElementNames(classRef) || []) as K[];
}

export function getInsertColumnNames<T, K extends keyof PickWritable<T>>(classRef: Type<T>): K[] {
    return (EntityModel.getInsertColumnNames(classRef) || []) as K[];
}

export function getUpdateColumnNames<T, K extends keyof PickWritable<T>>(classRef: Type<T>): K[] {
    return (EntityModel.getUpdateColumnNames(classRef) || []) as K[];
}
