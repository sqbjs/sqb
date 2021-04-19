import {ColumnTransformFunction} from '../types';
import {EntityMeta} from '../metadata/entity-meta';

export function Parse(fn: ColumnTransformFunction): PropertyDecorator {
    return (target: Object, propertyKey: string | symbol): void => {
        if (typeof propertyKey !== 'string')
            throw new Error('You can define a Column for only string properties');
        EntityMeta.attachTo(target.constructor)
            .defineColumnElement(propertyKey)
            .parse = fn;
    }
}

export function Serialize(fn: ColumnTransformFunction): PropertyDecorator {
    return (target: Object, propertyKey: string | symbol): void => {
        if (typeof propertyKey !== 'string')
            throw new Error('You can define a Column for only string properties');
        EntityMeta.attachTo(target.constructor)
            .defineColumnElement(propertyKey)
            .serialize = fn;
    }
}
