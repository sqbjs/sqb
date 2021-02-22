import {NestedOptions, ConstructorThunk} from '../types';
import {EntityMeta} from '../metadata/entity-meta';

export function Embedded(type: ConstructorThunk, options?: NestedOptions): PropertyDecorator {
    return (target: Object, propertyKey: string | symbol): void => {
        if (typeof propertyKey !== 'string')
            throw new Error('Symbol properties are not accepted');
        if (typeof type !== 'function')
            throw new Error('You must provide "type" argument');
        const el = EntityMeta.attachTo(target.constructor)
            .setEmbeddedElement(propertyKey, type);
        if (options?.fieldNamePrefix)
            el.fieldNamePrefix = options.fieldNamePrefix;
        if (options?.fieldNameSuffix)
            el.fieldNamePrefix = options.fieldNameSuffix;
    }
}
