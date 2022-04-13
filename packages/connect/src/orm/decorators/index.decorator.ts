import {IndexMetadata} from '../interfaces/index-metadata';
import {EntityMetadata} from '../model/entity-model';

export function Index(fields: string | string[], options?: Omit<IndexMetadata, 'columns'>): ClassDecorator
export function Index(options?: Omit<IndexMetadata, 'columns'>): PropertyDecorator
export function Index(arg0: any, arg1?: any): ClassDecorator | PropertyDecorator {
    return function (target: Object | Function, propertyKey?: string | symbol): void {
        if (typeof target === 'function') {
            if (!(typeof arg0 === 'string' || Array.isArray(arg0)))
                throw new Error(`You must specify index column(s)`);
            const model = EntityMetadata.attachTo(target);
            return EntityMetadata.addIndex(model, {...arg1, columns: arg0});
        }
        if (!target.constructor)
            throw new Error('Property decorators can be used for class properties only');
        if (typeof propertyKey !== 'string')
            throw new Error('Index() decorator can be used for string property keys only');
        const model = EntityMetadata.attachTo(target.constructor);
        EntityMetadata.addIndex(model, {...arg0, columns: [propertyKey]});
    };

}
