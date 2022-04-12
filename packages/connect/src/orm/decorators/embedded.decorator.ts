import {EntityMetadata} from '../model/entity-model';
import {EmbeddedTypeOptions, TypeThunk} from '../orm.type';

export function Embedded(type?: TypeThunk, options?: EmbeddedTypeOptions): PropertyDecorator {
    return (target: Object, propertyKey: string | symbol): void => {
        if (typeof propertyKey !== 'string')
            throw new Error('Symbol properties are not accepted');
        const el = EntityMetadata.attachTo(target.constructor)
            .defineObjectElement(propertyKey, type);
        if (options?.fieldNamePrefix)
            el.fieldNamePrefix = options.fieldNamePrefix;
        if (options?.fieldNameSuffix)
            el.fieldNameSuffix = options.fieldNameSuffix;
    }
}
