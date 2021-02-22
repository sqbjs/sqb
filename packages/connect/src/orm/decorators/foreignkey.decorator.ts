import {ConstructorThunk, ForeignKeyOptions} from '../types';
import {EntityMeta} from '../metadata/entity-meta';

export function ForeignKey(type: ConstructorThunk, targetColumn?: string): PropertyDecorator
export function ForeignKey(type: ConstructorThunk, options?: Omit<ForeignKeyOptions, 'keyColumn'>): PropertyDecorator
export function ForeignKey(type: ConstructorThunk, arg1?: any): PropertyDecorator {
    return function (target: Object | Function, propertyKey?: string | symbol): void {
        if (typeof propertyKey !== 'string')
            throw new Error('Symbol properties are not accepted');
        const opts = typeof arg1 === 'string' ?
            {targetColumn: arg1} : arg1;
        EntityMeta.attachTo(target.constructor)
            .addForeignKey(type, propertyKey, opts);
    };

}

export function ForeignIndex(type: ConstructorThunk, options?: ForeignKeyOptions): ClassDecorator {
    return function (target: Function) {
        const entity = EntityMeta.attachTo(target);
        entity.addForeignIndex(type, options);
    }
}
