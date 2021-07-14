import {EmbeddedTypeOptions, TypeThunk} from '../orm.type';
import {EntityModel} from '../model/entity-model';

export function Embedded(type?: TypeThunk, options?: EmbeddedTypeOptions): PropertyDecorator {
    return (target: Object, propertyKey: string | symbol): void => {
        if (typeof propertyKey !== 'string')
            throw new Error('Symbol properties are not accepted');
        const el = EntityModel.attachTo(target.constructor)
            .defineObjectElement(propertyKey, type);
        if (options?.fieldNamePrefix)
            el.fieldNamePrefix = options.fieldNamePrefix;
        if (options?.fieldNameSuffix)
            el.fieldNameSuffix = options.fieldNameSuffix;
    }
}
