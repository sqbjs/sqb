import {DataType} from '@sqb/builder';
import {DataPropertyOptions} from '../orm.type';
import {EntityModel} from '../model/entity-model';

export function Column(type?: DataType): PropertyDecorator
export function Column(options?: DataPropertyOptions): PropertyDecorator
export function Column(arg0?: DataType | DataPropertyOptions): PropertyDecorator {
    return (target: Object, propertyKey: string | symbol): void => {
        if (typeof propertyKey !== 'string')
            throw new Error('Symbol properties are not accepted');
        const options = typeof arg0 === 'string' ? {dataType: arg0} : arg0;
        EntityModel.attachTo(target.constructor)
            .defineColumnElement(propertyKey, options);
    }
}
