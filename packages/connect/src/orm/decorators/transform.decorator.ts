import {ColumnTransformFunction} from '../orm.type';
import {EntityModel} from '../model/entity-model';

export function Parse(fn: ColumnTransformFunction): PropertyDecorator {
    return (target: Object, propertyKey: string | symbol): void => {
        if (typeof propertyKey !== 'string')
            throw new Error('You can define a Column for only string properties');
        EntityModel.attachTo(target.constructor)
            .defineDataProperty(propertyKey)
            .parse = fn;
    }
}

export function Serialize(fn: ColumnTransformFunction): PropertyDecorator {
    return (target: Object, propertyKey: string | symbol): void => {
        if (typeof propertyKey !== 'string')
            throw new Error('You can define a Column for only string properties');
        EntityModel.attachTo(target.constructor)
            .defineDataProperty(propertyKey)
            .serialize = fn;
    }
}
