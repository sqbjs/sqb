import {BASE_ENTITY_REPOSITORY_KEY} from './consts';
import {Repository} from './Repository';

export class BaseEntity {
    [BASE_ENTITY_REPOSITORY_KEY]: Repository<any>;

    async remove(): Promise<boolean> {
        const repo = this[BASE_ENTITY_REPOSITORY_KEY];
        const keyValues = repo.getKeyValues(this);
        return await this[BASE_ENTITY_REPOSITORY_KEY].remove(keyValues);
    }

}
