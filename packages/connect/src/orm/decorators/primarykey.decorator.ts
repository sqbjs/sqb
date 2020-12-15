import {IndexConfig} from '../types';
import {EntityDefinition} from '../definition/EntityDefinition';

export function PrimaryKey(options?: IndexConfig): PropertyDecorator
export function PrimaryKey(fields: string | string[], options?: IndexConfig): ClassDecorator
export function PrimaryKey(arg0: any, arg1?: any): ClassDecorator | PropertyDecorator {
    return function (target: Object | Function, propertyKey?: string): void {
        if (arguments.length === 1) {
            const entity = EntityDefinition.attach(target as Function);
            entity.definePrimaryIndex(arg0, arg1);
            return;
        }
        if (!target.constructor)
            throw new Error('Property decorators can be used for class properties only');
        if (typeof propertyKey !== 'string')
            throw new Error('Index() decorator can be used for string property keys only');
        const entity = EntityDefinition.attach(target.constructor);
        const col = entity.addDataColumn(propertyKey);
        col.sortAscending = true;
        entity.definePrimaryIndex(propertyKey, arg0);
        return;
    };
}
