import {DataType} from '@sqb/builder';
import {ColumnElementOptions} from '../model/column-element-metadata';
import {EntityMetadata} from '../model/entity-metadata';

export function Column(type?: DataType): PropertyDecorator
export function Column(options?: ColumnElementOptions): PropertyDecorator
export function Column(arg0): PropertyDecorator {
    return (target: Object, propertyKey: string | symbol): void => {
        if (typeof propertyKey !== 'string')
            throw new Error('Symbol properties are not accepted');
        const options = (typeof arg0 === 'string' ? {dataType: arg0} : arg0) || {};
        const entity = EntityMetadata.define(target.constructor);

        if (!options.type) {
            const typ = Reflect.getMetadata("design:type", entity.ctor.prototype, propertyKey);
            if (typ === Array) {
                options.type = String;
                options.isArray = true;
            } else options.type = typ;
        }

        EntityMetadata.defineColumnElement(entity, propertyKey, options);
    }
}
