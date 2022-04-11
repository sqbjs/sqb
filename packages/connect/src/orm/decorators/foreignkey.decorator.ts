import {EntityModel} from '../model/entity-model';
import {TypeThunk} from '../orm.type';

export function ForeignKey(type: TypeThunk, targetKey?: string): PropertyDecorator {
    return function (target: Object | Function, propertyKey?: string | symbol): void {
        if (typeof propertyKey !== 'string')
            throw new Error('Symbol properties are not accepted');
        EntityModel.attachTo(target.constructor)
            .addForeignKey(propertyKey, type, targetKey);
    };

}
