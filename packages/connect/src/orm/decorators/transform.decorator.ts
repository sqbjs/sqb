import {EntityDefinition} from '../definition/EntityDefinition';
import {ColumnTransform} from '../types';

export function Transform(fn: ColumnTransform): PropertyDecorator {
    return (target: Object, propertyKey: string | symbol): void => {
        if (typeof propertyKey !== 'string')
            throw new Error('You can define a Column for only string properties');
        const entity = EntityDefinition.attach(target.constructor);
        const col = entity.addDataColumn(propertyKey);
        col.transform = fn;
    }
}
