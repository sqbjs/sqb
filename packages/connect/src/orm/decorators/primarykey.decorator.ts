import {IndexConfig} from '../orm.types';
import {declareColumn, declareEntity} from '../helpers';

export function PrimaryKey(fields: string | string[], options?: IndexConfig): ClassDecorator
export function PrimaryKey(options?: IndexConfig): PropertyDecorator
export function PrimaryKey(arg0: any, arg1?: any): ClassDecorator | PropertyDecorator {
    return function (target: Object | Function, propertyKey?: string): void {
        if (arguments.length === 1) {
            const entity = declareEntity(target as Function);
            entity.definePrimaryIndex(arg0, arg1);
            return;
        }
        if (!target.constructor)
            throw new Error('Property decorators can be used for class properties only');
        if (typeof propertyKey !== 'string')
            throw new Error('Index() decorator can be used for string property keys only');
        const entity = declareEntity(target.constructor);
        declareColumn(target, propertyKey);
        entity.definePrimaryIndex(propertyKey, arg0);
        return;
    };
}
