import {EmbeddedTypeOptions, ConstructorThunk} from '../types';
import {EntityMeta} from '../metadata/entity-meta';

export function Embedded(type?: ConstructorThunk, options?: EmbeddedTypeOptions): PropertyDecorator {
    return (target: Object, propertyKey: string | symbol): void => {
        if (typeof propertyKey !== 'string')
            throw new Error('Symbol properties are not accepted');
        const el = EntityMeta.attachTo(target.constructor)
            .setEmbeddedElement(propertyKey, type);
        if (options?.fieldNamePrefix)
            el.fieldNamePrefix = options.fieldNamePrefix;
        if (options?.fieldNameSuffix)
            el.fieldNameSuffix = options.fieldNameSuffix;
    }
}
