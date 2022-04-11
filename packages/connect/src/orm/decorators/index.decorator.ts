import {EntityModel} from '../model/entity-model';
import {IndexOptions} from '../orm.type';

export function Index(fields: string | string[], options?: IndexOptions): ClassDecorator
export function Index(options?: IndexOptions): PropertyDecorator
export function Index(arg0: any, arg1?: any): ClassDecorator | PropertyDecorator {
    return function (target: Object | Function, propertyKey?: string | symbol): void {
        if (typeof target === 'function') {
            if (!(typeof arg0 === 'string' || Array.isArray(arg0)))
                throw new Error(`You must specify index column(s)`);
            const entity = EntityModel.attachTo(target);
            entity.addIndex(arg0, arg1);
            return;
        }
        if (!target.constructor)
            throw new Error('Property decorators can be used for class properties only');
        if (typeof propertyKey !== 'string')
            throw new Error('Index() decorator can be used for string property keys only');
        const entity = EntityModel.attachTo(target.constructor);
        entity.addIndex(propertyKey, arg0);
    };

}
