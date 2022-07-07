import {Entity} from './decorators/entity.decorator';
import {REPOSITORY_KEY} from './orm.const';
import type {Repository} from './repository.class';

export class BaseEntity {
    private [REPOSITORY_KEY]?: Repository<any>;

    constructor(partial?: any) {
        const elements = Entity.getColumnNames(Object.getPrototypeOf(this).constructor);
        if (elements && partial) {
            for (const k of elements)
                if (partial[k] !== undefined)
                    this[k] = partial[k];
        }
    }

    async destroy(): Promise<boolean> {
        const repo = this[REPOSITORY_KEY];
        return !!(repo && repo.destroy(this));
    }

    async exists(): Promise<boolean> {
        const repo = this[REPOSITORY_KEY];
        return !!(repo && repo.exists(this));
    }

    toJSON(): any {
        // this method is an placeholder an will be overwritten by declareEntity() method
        return this;
    }
}
