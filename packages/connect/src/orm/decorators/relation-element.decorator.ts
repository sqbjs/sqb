import {ConstructorThunk, RelationColumnOptions} from '../types';
import {EntityMeta} from '../metadata/entity-meta';
import {isClass} from '../helpers';
import {EntityLinkDef} from '../metadata/entity-link';

export function HasOne(type?: ConstructorThunk | EntityLinkDef<any>,
                       options?: Omit<RelationColumnOptions, 'hasMany' | 'lazy'>): PropertyDecorator {
    return (target: Object, propertyKey: string | symbol): void => {
        if (typeof propertyKey !== 'string')
            throw new Error('You can define a column for only string properties');
        type = type || Reflect.getMetadata("design:type", target, propertyKey);
        if (!type || type === Array)
            throw new Error('You must provide "type"');
        const entity = EntityMeta.attachTo(target.constructor);
        const opts = {...options, hasMany: false, lazy: false}
        entity.defineRelationElement(propertyKey, type, opts);
    }
}

export function HasOneLazy(type?: ConstructorThunk, options?: Omit<RelationColumnOptions, 'hasMany' | 'lazy'>): PropertyDecorator {
    return (target: Object, propertyKey: string | symbol): void => {
        if (typeof propertyKey !== 'string')
            throw new Error('You can define a column for only string properties');
        type = type || Reflect.getMetadata("design:type", target, propertyKey);
        if (!type || type === Array)
            throw new Error('You must provide "type"');
        const entity = EntityMeta.attachTo(target.constructor);
        const opts = {...options, hasMany: false, lazy: true}
        entity.defineRelationElement(propertyKey, type, opts);
    }
}

export function HasMany(type: ConstructorThunk, options?: Omit<RelationColumnOptions, 'hasMany' | 'lazy'>): PropertyDecorator {
    return (target: Object, propertyKey: string | symbol): void => {
        if (typeof propertyKey !== 'string')
            throw new Error('You can define a column for only string properties');
        if (!type)
            throw new Error('You must provide target entity');
        if (Reflect.getMetadata("design:type", target, propertyKey) !== Array)
            throw new Error(`Returning type of property (${propertyKey}) must be an array`);
        const entity = EntityMeta.attachTo(target.constructor);
        const opts = {...options, hasMany: true, lazy: false}
        entity.defineRelationElement(propertyKey, type, opts);
    }
}

export function HasManyLazy(type: ConstructorThunk, options?: Omit<RelationColumnOptions, 'hasMany' | 'lazy'>): PropertyDecorator {
    return (target: Object, propertyKey: string | symbol): void => {
        if (typeof propertyKey !== 'string')
            throw new Error('You can define a column for only string properties');
        if (!type)
            throw new Error('You must provide target entity');
        const typ = Reflect.getMetadata("design:type", target, propertyKey);
        if (typeof typ !== 'function' || isClass(typ))
            throw new Error(`Function type type required for property "${propertyKey}", but ${typ} found`);
        const entity = EntityMeta.attachTo(target.constructor);
        const opts = {...options, hasMany: true, lazy: true}
        entity.defineRelationElement(propertyKey, type, opts);
    }
}
