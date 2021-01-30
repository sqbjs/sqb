import {IndexConfig} from '../orm.types';
import {declareEntity} from '../helpers';

export function Index(options?: IndexConfig): PropertyDecorator
export function Index(fields: string | string[], options?: IndexConfig): ClassDecorator
export function Index(arg0: any, arg1?: any): ClassDecorator | PropertyDecorator {
    return function (target: Object | Function, propertyKey?: string): void {
        if (typeof target === 'function') {
            const entity = declareEntity(target);
            entity.defineIndex(arg0, arg1);
            return;
        }
        if (!target.constructor)
            throw new Error('Property decorators can be used for class properties only');
        if (typeof propertyKey !== 'string')
            throw new Error('Index() decorator can be used for string property keys only');
        const entity = declareEntity(target.constructor);
        entity.defineIndex(propertyKey, arg0);
        return;
    };
}
