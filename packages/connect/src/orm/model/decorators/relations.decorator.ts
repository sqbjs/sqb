import {RelationColumnConfig} from '../../orm.types';
import {EntityDefinition} from '../EntityDefinition';

export function HasOne(cfg: RelationColumnConfig): PropertyDecorator {
    return (target: Object, propertyKey: string | symbol): void => {
        if (typeof propertyKey !== 'string')
            throw new Error('You can define a column for only string properties');
        const entity = EntityDefinition.attach(target.constructor);
        entity.addOne2OneRelation(propertyKey, cfg);
    }
}

export function HasMany(cfg: RelationColumnConfig): PropertyDecorator {
    return (target: Object, propertyKey: string | symbol): void => {
        if (typeof propertyKey !== 'string')
            throw new Error('You can define a column for only string properties');
        const entity = EntityDefinition.attach(target.constructor);
        entity.addOne2ManyRelation(propertyKey, cfg);
    }
}
