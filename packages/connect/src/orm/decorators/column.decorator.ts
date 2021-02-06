import {ColumnConfig} from '../orm.types';
import {DataType} from '../..';
import {declareEntity} from '../helpers';

export function Column(options?: DataType | ColumnConfig): PropertyDecorator {
    return (target: Object, propertyKey: string | symbol): void => {
        if (typeof propertyKey !== 'string')
            throw new Error('You can define a Column for only formal properties');
        const opts = typeof options === 'string' ?
            {dataType: options} : options;
        declareEntity(target.constructor).defineDataColumn(propertyKey, opts);
    }
}
