import {ColumnAutoGenerationStrategy} from '../orm.types';
import {declareColumn} from '../helpers';

export function AutoGenerated(strategy: ColumnAutoGenerationStrategy): PropertyDecorator {
    return (target: Object, propertyKey: string | symbol): void => {
        if (typeof propertyKey !== 'string')
            throw new Error('You can define a Column for only string properties');
        const col = declareColumn(target, propertyKey);
        col.autoGenerate = strategy;
    }
}
