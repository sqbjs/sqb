import {EntityDefinition} from '../EntityDefinition';
import {SortDirection} from '../orm.types';

export function Sort(direction?: SortDirection): PropertyDecorator {
    return (target: Object, propertyKey: string | symbol): void => {
        if (typeof propertyKey !== 'string')
            throw new Error('You can define a Column for only string properties');
        const entity = EntityDefinition.attach(target.constructor);
        const col = entity.addDataColumn(propertyKey);
        col.sortAscending = !direction || direction === 'ascending' || direction === 'both';
        col.sortDescending = direction === 'descending' || direction === 'both';
    }
}
