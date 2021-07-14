import {IndexOptions} from '../orm.type';
import {EntityModel} from '../model/entity-model';

export function PrimaryKey(fields: string | string[], options?: IndexOptions): ClassDecorator
export function PrimaryKey(options?: IndexOptions): PropertyDecorator
export function PrimaryKey(arg0: any, arg1?: any): ClassDecorator | PropertyDecorator {
    return function (target: Object | Function, propertyKey?: string): void {
        if (arguments.length === 1) {
            if (!(typeof arg0 === 'string' || Array.isArray(arg0)))
                throw new Error(`You must specify primary index column(s)`);
            const entity = EntityModel.attachTo(target as Function);
            entity.setPrimaryIndex(arg0, arg1);
            return;
        }
        if (!target.constructor)
            throw new Error('Property decorators can be used for class properties only');
        if (typeof propertyKey !== 'string')
            throw new Error('Index() decorator can be used for string property keys only');
        const entity = EntityModel.attachTo(target.constructor);
        entity.defineColumnElement(propertyKey, {notNull: true});
        entity.setPrimaryIndex(propertyKey, arg0);
    };
}
