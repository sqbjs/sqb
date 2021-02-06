import {GroupColumnConfig, ConstructorThunk} from '../orm.types';
import {declareEntity} from '../helpers';

export function ColumnGroup(options?: ConstructorThunk | GroupColumnConfig): PropertyDecorator {
    return (target: Object, propertyKey: string | symbol): void => {
        if (typeof propertyKey !== 'string')
            throw new Error('You can define ColumnGroup for only formal properties');
        if (!options)
            throw new Error('You must provide column configuration');
        const opts = typeof options === 'function' ?
            {type: options} : options;
        declareEntity(target.constructor)
            .defineGroupColumn(propertyKey, opts);
    }
}
