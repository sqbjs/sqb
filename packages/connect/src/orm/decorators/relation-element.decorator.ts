import {ConstructorThunk} from '../types';
import {EntityMeta} from '../metadata/entity-meta';
import {isClass} from '../helpers';
import {EntityChainBuilder} from '../metadata/entity-chain-ring';
import {Type} from '../../types';

export function HasOne(type?: ConstructorThunk | EntityChainBuilder<any>): PropertyDecorator {
    return (target: Object, propertyKey: string | symbol): void => {
        if (typeof propertyKey !== 'string')
            throw new Error('You can define a column for only string properties');
        type = type || Reflect.getMetadata("design:type", target, propertyKey);
        if (!type || type === Array)
            throw new Error('You must provide "type"');
        const entity = EntityMeta.attachTo(target.constructor as Type);
        const opts = {hasMany: false, lazy: false};
        if (type instanceof EntityChainBuilder) {
            type.first.source = entity.ctor;
            entity.defineRelationElement(propertyKey, type.first, opts);
        } else
            entity.defineRelationElement(propertyKey, type, opts);
    }
}

export function HasOneLazy(type?: ConstructorThunk | EntityChainBuilder<any>): PropertyDecorator {
    return (target: Object, propertyKey: string | symbol): void => {
        if (typeof propertyKey !== 'string')
            throw new Error('You can define a column for only string properties');
        type = type || Reflect.getMetadata("design:type", target, propertyKey);
        if (!type || type === Array)
            throw new Error('You must provide "type"');
        const entity = EntityMeta.attachTo(target.constructor as Type);
        const opts = {hasMany: false, lazy: true};
        if (type instanceof EntityChainBuilder) {
            type.first.source = entity.ctor;
            entity.defineRelationElement(propertyKey, type.first, opts);
        } else
            entity.defineRelationElement(propertyKey, type, opts);
    }
}

export function HasMany(type: ConstructorThunk | EntityChainBuilder<any>): PropertyDecorator {
    return (target: Object, propertyKey: string | symbol): void => {
        if (typeof propertyKey !== 'string')
            throw new Error('You can define a column for only string properties');
        if (!type)
            throw new Error('You must provide target entity');
        if (Reflect.getMetadata("design:type", target, propertyKey) !== Array)
            throw new Error(`Returning type of property (${propertyKey}) must be an array`);
        const entity = EntityMeta.attachTo(target.constructor as Type);
        const opts = {hasMany: true, lazy: false};
        if (type instanceof EntityChainBuilder) {
            type.first.source = entity.ctor;
            entity.defineRelationElement(propertyKey, type.first, opts);
        } else
            entity.defineRelationElement(propertyKey, type, opts);
    }
}

export function HasManyLazy(type: ConstructorThunk | EntityChainBuilder<any>): PropertyDecorator {
    return (target: Object, propertyKey: string | symbol): void => {
        if (typeof propertyKey !== 'string')
            throw new Error('You can define a column for only string properties');
        if (!type)
            throw new Error('You must provide target entity');
        const typ = Reflect.getMetadata("design:type", target, propertyKey);
        if (typeof typ !== 'function' || isClass(typ))
            throw new Error(`Function type type required for property "${propertyKey}", but ${typ} found`);
        const entity = EntityMeta.attachTo(target.constructor as Type);
        const opts = {hasMany: true, lazy: true};
        if (type instanceof EntityChainBuilder) {
            type.first.source = entity.ctor;
            entity.defineRelationElement(propertyKey, type.first, opts);
        } else
            entity.defineRelationElement(propertyKey, type, opts);
    }
}

/**
 * Crates an Entity Chain Builder object
 */
export function EntityChain<T>(type: ConstructorThunk<T>): EntityChainBuilder<T> {
    return new EntityChainBuilder<T>(type);
}
