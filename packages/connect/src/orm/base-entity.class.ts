import {PickReadonly, PickWritable, Type} from 'ts-gems';
import {EntityModel} from './model/entity-model';
import {REPOSITORY_KEY} from './orm.const';
import type {Repository} from './repository.class';

export class BaseEntity {
    private [REPOSITORY_KEY]: Repository<any>;

    constructor(partial?: any) {
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

export function getElementNames<T, K extends keyof T>(classRef: Type<T>): K[] {
    return (EntityModel.getElementNames(classRef) || []) as K[];
}

export function getColumnNames<T, K extends keyof PickWritable<T>>(classRef: Type<T>): K[] {
    return (EntityModel.getColumnNames(classRef) || []) as K[];
}

export function getObjectElementNames<T, K extends keyof PickWritable<T>>(classRef: Type<T>): K[] {
    return (EntityModel.getObjectElementNames(classRef) || []) as K[];
}

export function getAssociationElementNames<T, K extends keyof PickReadonly<T>>(classRef: Type<T>): K[] {
    return (EntityModel.getAssociationElementNames(classRef) || []) as K[];
}

export function getNonAssociationElementNames<T, K extends keyof PickWritable<T>>(classRef: Type<T>): K[] {
    return (EntityModel.getNonAssociationElementNames(classRef) || []) as K[];
}

export function getInsertColumnNames<T, K extends keyof PickWritable<T>>(classRef: Type<T>): K[] {
    return (EntityModel.getInsertColumnNames(classRef) || []) as K[];
}

export function getUpdateColumnNames<T, K extends keyof PickWritable<T>>(classRef: Type<T>): K[] {
    return (EntityModel.getUpdateColumnNames(classRef) || []) as K[];
}
