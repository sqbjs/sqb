import {EntityMeta} from '../metadata/entity-meta';

export function BeforeInsert(): PropertyDecorator {
    return (target: Object, propertyKey: string | symbol): void => {
        if (typeof propertyKey !== 'string')
            throw new Error('You can define a Column for only string properties');
        const entity = EntityMeta.attachTo(target.constructor);
        const fn = target.constructor.prototype[propertyKey]
        if (typeof fn !== 'function')
            throw new Error('Property must be a function');
        entity.before('insert', fn);
    }
}

export function BeforeUpdate(): PropertyDecorator {
    return (target: Object, propertyKey: string | symbol): void => {
        if (typeof propertyKey !== 'string')
            throw new Error('You can define a Column for only string properties');
        const entity = EntityMeta.attachTo(target.constructor);
        const fn = target.constructor.prototype[propertyKey]
        if (typeof fn !== 'function')
            throw new Error('Property must be a function');
        entity.before('update', fn);
    }
}

export function BeforeDestroy(): PropertyDecorator {
    return (target: Object, propertyKey: string | symbol): void => {
        if (typeof propertyKey !== 'string')
            throw new Error('You can define a Column for only string properties');
        const entity = EntityMeta.attachTo(target.constructor);
        const fn = target.constructor.prototype[propertyKey]
        if (typeof fn !== 'function')
            throw new Error('Property must be a function');
        entity.before('destroy', fn);
    }
}

export function AfterInsert(): PropertyDecorator {
    return (target: Object, propertyKey: string | symbol): void => {
        if (typeof propertyKey !== 'string')
            throw new Error('You can define a Column for only string properties');
        const entity = EntityMeta.attachTo(target.constructor);
        const fn = target.constructor.prototype[propertyKey]
        if (typeof fn !== 'function')
            throw new Error('Property must be a function');
        entity.after('insert', fn);
    }
}

export function AfterUpdate(): PropertyDecorator {
    return (target: Object, propertyKey: string | symbol): void => {
        if (typeof propertyKey !== 'string')
            throw new Error('You can define a Column for only string properties');
        const entity = EntityMeta.attachTo(target.constructor);
        const fn = target.constructor.prototype[propertyKey]
        if (typeof fn !== 'function')
            throw new Error('Property must be a function');
        entity.after('update', fn);
    }
}

export function AfterDestroy(): PropertyDecorator {
    return (target: Object, propertyKey: string | symbol): void => {
        if (typeof propertyKey !== 'string')
            throw new Error('You can define a Column for only string properties');
        const entity = EntityMeta.attachTo(target.constructor);
        const fn = target.constructor.prototype[propertyKey]
        if (typeof fn !== 'function')
            throw new Error('Property must be a function');
        entity.after('destroy', fn);
    }
}
