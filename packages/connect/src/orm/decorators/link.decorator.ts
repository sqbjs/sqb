import {Type} from 'ts-gems';
import {EntityMetadata} from '../model/entity-model';
import {LinkChain} from '../model/link-chain';
import {TypeThunk} from '../orm.type';

export function Link(chain: LinkChain<any>): PropertyDecorator {
    return (target: Object, propertyKey: string | symbol): void => {
        if (typeof propertyKey !== 'string')
            throw new Error('You can define a column for only string properties');
        if (chain.first.returnsMany() &&
            Reflect.getMetadata("design:type", target, propertyKey) !== Array)
            throw new Error(`Returning type of property (${propertyKey}) must be an array`);
        const entity = EntityMetadata.attachTo(target.constructor as Type);
        // @ts-ignore
        // noinspection JSConstantReassignment
        chain.first.source = entity.ctor;
        entity.defineAssociationElement(propertyKey, chain.first);
    }
}

export function LinkToOne(type?: TypeThunk, targetKey?: string, sourceKey?: string): PropertyDecorator {
    return (target: any, propertyKey: string | symbol): void => {
        type = type || Reflect.getMetadata("design:type", target, propertyKey);
        if (!type || type === Array)
            throw new Error('You must provide "type"');
        const chain = linkToOne(type, targetKey, sourceKey);
        Link(chain)(target, propertyKey);
    }
}

export function LinkToMany(type: TypeThunk, targetKey?: string, sourceKey?: string): PropertyDecorator {
    return (target: any, propertyKey: string | symbol): void => {
        type = type || Reflect.getMetadata("design:type", target, propertyKey);
        if (!type || type === Array)
            throw new Error('You must provide "type"');
        const chain = linkToMany(type, targetKey, sourceKey);
        Link(chain)(target, propertyKey);
    }
}

export function LinkFromOne(type?: TypeThunk, targetKey?: string, sourceKey?: string): PropertyDecorator {
    return (target: any, propertyKey: string | symbol): void => {
        type = type || Reflect.getMetadata("design:type", target, propertyKey);
        if (!type || type === Array)
            throw new Error('You must provide "type"');
        const chain = linkFromOne(type, targetKey, sourceKey);
        Link(chain)(target, propertyKey);
    }
}

export function LinkFromMany(type?: TypeThunk, targetKey?: string, sourceKey?: string): PropertyDecorator {
    return (target: any, propertyKey: string | symbol): void => {
        type = type || Reflect.getMetadata("design:type", target, propertyKey);
        if (!type || type === Array)
            throw new Error('You must provide "type"');
        const chain = linkFromMany(type, targetKey, sourceKey);
        Link(chain)(target, propertyKey);
    }
}

/**
 * Crates an Link Chain object
 */
export function linkToOne<T>(type: TypeThunk<T>, targetKey?: keyof T, sourceKey?: string): LinkChain<T> {
    return new LinkChain<T>(type, 'to', targetKey, sourceKey);
}

/**
 * Crates an Link Chain object
 */
export function linkToMany<T>(type: TypeThunk<T>, targetKey?: keyof T, sourceKey?: string): LinkChain<T> {
    return new LinkChain<T>(type, 'to-many', targetKey, sourceKey);
}

/**
 * Crates an Link Chain object
 */
export function linkFromOne<T>(type: TypeThunk<T>, targetKey?: keyof T, sourceKey?: string): LinkChain<T> {
    return new LinkChain<T>(type, 'from', targetKey, sourceKey);
}

/**
 * Crates an Link Chain object
 */
export function linkFromMany<T>(type: TypeThunk<T>, targetKey?: keyof T, sourceKey?: string): LinkChain<T> {
    return new LinkChain<T>(type, 'from-many', targetKey, sourceKey);
}
