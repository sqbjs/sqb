import {ColumnTransformFunction} from '../orm.types';
import {declareEntity} from '../helpers';

export function TransformRead(fn: ColumnTransformFunction): PropertyDecorator {
    return (target: Object, propertyKey: string | symbol): void => {
        if (typeof propertyKey !== 'string')
            throw new Error('You can define a Column for only string properties');
        declareEntity(target.constructor)
            .defineDataColumn(propertyKey)
            .transformRead = fn;
    }
}

export function TransformWrite(fn: ColumnTransformFunction): PropertyDecorator {
    return (target: Object, propertyKey: string | symbol): void => {
        if (typeof propertyKey !== 'string')
            throw new Error('You can define a Column for only string properties');
        declareEntity(target.constructor)
            .defineDataColumn(propertyKey)
            .transformWrite = fn;
    }
}
