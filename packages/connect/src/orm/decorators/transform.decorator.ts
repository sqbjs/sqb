import {EntityModel} from '../model/entity-model';
import {ColumnTransformFunction} from '../orm.type';

export function Parse(fn: ColumnTransformFunction): PropertyDecorator {
    return (target: Object, propertyKey: string | symbol): void => {
        if (typeof propertyKey !== 'string')
            throw new Error('You can define a Column for only string properties');
        EntityModel.attachTo(target.constructor)
            .defineColumnElement(propertyKey)
            .parse = fn;
    }
}

export function Serialize(fn: ColumnTransformFunction): PropertyDecorator {
    return (target: Object, propertyKey: string | symbol): void => {
        if (typeof propertyKey !== 'string')
            throw new Error('You can define a Column for only string properties');
        EntityModel.attachTo(target.constructor)
            .defineColumnElement(propertyKey)
            .serialize = fn;
    }
}
