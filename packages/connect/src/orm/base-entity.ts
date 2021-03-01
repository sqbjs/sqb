import {REPOSITORY_KEY} from './consts';
import type {Repository} from './repository';
import {EntityMeta} from './metadata/entity-meta';

export abstract class BaseEntity<T> {
    private [REPOSITORY_KEY]: Repository<any>;

    constructor(partial: Partial<T>) {
        const elements = EntityMeta.getDataColumnNames(Object.getPrototypeOf(this).constructor);
        if (elements) {
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

    static getElementNames<TT extends BaseEntity<any>, K extends keyof TT>(): K[] {
        return (EntityMeta.getElementNames(this) || []) as K[];
    }

    static getDataColumnNames<TT extends BaseEntity<any>, K extends keyof TT>(): K[] {
        return (EntityMeta.getDataColumnNames(this) || []) as K[];
    }

    static getInsertColumnNames<TT extends BaseEntity<any>, K extends keyof TT>(): K[] {
        return (EntityMeta.getInsertColumnNames(this) || []) as K[];
    }

    static getUpdateColumnNames<TT extends BaseEntity<any>, K extends keyof TT>(): K[] {
        return (EntityMeta.getUpdateColumnNames(this) || []) as K[];
    }

}
