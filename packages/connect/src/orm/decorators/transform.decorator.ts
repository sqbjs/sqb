import {ColumnTransformFunction} from '../orm.types';
import {declareColumn} from '../helpers';

export function TransformRead(fn: ColumnTransformFunction): PropertyDecorator {
    return (target: Object, propertyKey: string | symbol): void => {
        if (typeof propertyKey !== 'string')
            throw new Error('You can define a Column for only string properties');
        const col = declareColumn(target, propertyKey);
        col.transformRead = fn;
    }
}

export function TransformWrite(fn: ColumnTransformFunction): PropertyDecorator {
    return (target: Object, propertyKey: string | symbol): void => {
        if (typeof propertyKey !== 'string')
            throw new Error('You can define a Column for only string properties');
        const col = declareColumn(target,  propertyKey);
        col.transformWrite = fn;
    }
}
