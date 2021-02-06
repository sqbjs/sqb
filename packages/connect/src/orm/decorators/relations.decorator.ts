import {RelationColumnConfig} from '../orm.types';
import {declareEntity} from '../helpers';

export function HasOne(cfg: RelationColumnConfig): PropertyDecorator {
    return (target: Object, propertyKey: string | symbol): void => {
        if (typeof propertyKey !== 'string')
            throw new Error('You can define a column for only string properties');
        const entity = declareEntity(target.constructor);
        entity.defineOne2OneRelation(propertyKey, cfg);
    }
}

export function HasMany(cfg: RelationColumnConfig): PropertyDecorator {
    return (target: Object, propertyKey: string | symbol): void => {
        if (typeof propertyKey !== 'string')
            throw new Error('You can define a column for only string properties');
        const entity = declareEntity(target.constructor);
        entity.defineOne2ManyRelation(propertyKey, cfg);
    }
}
