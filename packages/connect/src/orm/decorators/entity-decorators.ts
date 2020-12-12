import {EntityDefinition} from '../definition/EntityDefinition';
import {AutoGenerationStrategy, ColumnOptions, EntityOptions, IndexOptions} from '../types';

export function Entity(options?: EntityOptions | string): ClassDecorator {
    return function (target: Function) {
        const opts: EntityOptions = typeof options === 'object' ? options : {};
        const name = typeof options === 'string' ? options : opts.name;
        const entity = EntityDefinition.attach(target);
        if (name)
            entity.name = name;
        if (opts.schema)
            entity.schema = opts.schema;
        if (opts.comment)
            entity.comment = opts.comment;
    };
}

export namespace Entity {
    export function getMetadata(ctor: Function): EntityDefinition {
        return EntityDefinition.get(ctor);
    }
}


export function PrimaryKey(options?: IndexOptions): PropertyDecorator
export function PrimaryKey(fields: string | string[], options?: IndexOptions): ClassDecorator
export function PrimaryKey(arg0: any, arg1?: any): ClassDecorator | PropertyDecorator {
    return function (target: Object | Function, propertyKey?: string): void {
        if (arguments.length === 1) {
            const entity = EntityDefinition.attach(target as Function);
            entity.definePrimaryIndex(arg0, arg1);
            return;
        }
        if (!target.constructor)
            throw new Error('Property decorators can be used for class properties only');
        if (typeof propertyKey !== 'string')
            throw new Error('Index() decorator can be used for string property keys only');
        const entity = EntityDefinition.attach(target.constructor);
        const col = entity.addColumn(propertyKey);
        col.sortAscending = true;
        entity.definePrimaryIndex(propertyKey, arg0);
        return;
    };
}

export function Index(options?: IndexOptions): PropertyDecorator
export function Index(fields: string | string[], options?: IndexOptions): ClassDecorator
export function Index(arg0: any, arg1?: any): ClassDecorator | PropertyDecorator {
    return function (target: Object | Function, propertyKey?: string): void {
        if (arguments.length === 1) {
            const entity = EntityDefinition.attach(target as Function);
            entity.defineIndex(arg0, arg1);
            return;
        }
        if (!target.constructor)
            throw new Error('Property decorators can be used for class properties only');
        if (typeof propertyKey !== 'string')
            throw new Error('Index() decorator can be used for string property keys only');
        const entity = EntityDefinition.attach(target.constructor);
        entity.defineIndex(propertyKey, arg0);
        return;
    };
}

export function Column(options?: string | ColumnOptions): PropertyDecorator {
    return (target: Object, propertyKey: string | symbol): void => {
        if (typeof propertyKey !== 'string')
            throw new Error('You can define a Column for only string properties');
        const entity = EntityDefinition.attach(target.constructor);
        const opts = typeof options === 'string' ?
            {type: options} : options;
        const col = entity.addColumn(propertyKey);
        if (opts) {
            if (opts.fieldName)
                col.fieldName = opts.fieldName || entity.name;
            if (opts.type)
                col.type = opts.type;
            if (opts.defaultValue !== undefined)
                col.defaultValue = opts.defaultValue;
            if (opts.array !== undefined)
                col.array = opts.array;
            if (opts.comment !== undefined)
                col.comment = opts.comment;
            if (opts.collation !== undefined)
                col.collation = opts?.collation;
            if (opts.nullable !== undefined)
                col.nullable = opts?.nullable;
            if (opts.enum !== undefined)
                col.enum = opts?.enum;
            if (opts.length !== undefined)
                col.length = opts?.length;
            if (opts.precision !== undefined)
                col.precision = opts?.precision;
            if (opts.scale !== undefined)
                col.scale = opts?.scale;
            if (opts.autoGenerate !== undefined)
                col.autoGenerate = opts?.autoGenerate;
        }
    }
}

export function Generated(strategy: AutoGenerationStrategy): PropertyDecorator {
    return (target: Object, propertyKey: string | symbol): void => {
        if (typeof propertyKey !== 'string')
            throw new Error('You can define a Column for only string properties');
        const entity = EntityDefinition.attach(target.constructor);
        const col = entity.addColumn(propertyKey);
        col.autoGenerate = strategy;
    }
}

export function SortAscending(): PropertyDecorator {
    return (target: Object, propertyKey: string | symbol): void => {
        if (typeof propertyKey !== 'string')
            throw new Error('You can define a Column for only string properties');
        const entity = EntityDefinition.attach(target.constructor);
        const col = entity.addColumn(propertyKey);
        col.sortAscending = true;
    }
}

export function SortDescending(): PropertyDecorator {
    return (target: Object, propertyKey: string | symbol): void => {
        if (typeof propertyKey !== 'string')
            throw new Error('You can define a Column for only string properties');
        const entity = EntityDefinition.attach(target.constructor);
        const col = entity.addColumn(propertyKey);
        col.sortDescending = true;
    }
}

export function BeforeInsert(): PropertyDecorator {
    return (target: Object, propertyKey: string | symbol): void => {
        if (typeof propertyKey !== 'string')
            throw new Error('You can define a Column for only string properties');
        const entity = EntityDefinition.attach(target.constructor);
        const fn = target.constructor.prototype[propertyKey]
        if (typeof fn !== 'function')
            throw new Error('Property must be a function');
        entity.beforeInsert(fn);
    }
}

export function BeforeUpdate(): PropertyDecorator {
    return (target: Object, propertyKey: string | symbol): void => {
        if (typeof propertyKey !== 'string')
            throw new Error('You can define a Column for only string properties');
        const entity = EntityDefinition.attach(target.constructor);
        const fn = target.constructor.prototype[propertyKey]
        if (typeof fn !== 'function')
            throw new Error('Property must be a function');
        entity.beforeUpdate(fn);
    }
}

export function BeforeRemove(): PropertyDecorator {
    return (target: Object, propertyKey: string | symbol): void => {
        if (typeof propertyKey !== 'string')
            throw new Error('You can define a Column for only string properties');
        const entity = EntityDefinition.attach(target.constructor);
        const fn = target.constructor.prototype[propertyKey]
        if (typeof fn !== 'function')
            throw new Error('Property must be a function');
        entity.beforeRemove(fn);
    }
}

export function AfterInsert(): PropertyDecorator {
    return (target: Object, propertyKey: string | symbol): void => {
        if (typeof propertyKey !== 'string')
            throw new Error('You can define a Column for only string properties');
        const entity = EntityDefinition.attach(target.constructor);
        const fn = target.constructor.prototype[propertyKey]
        if (typeof fn !== 'function')
            throw new Error('Property must be a function');
        entity.afterInsert(fn);
    }
}

export function AfterUpdate(): PropertyDecorator {
    return (target: Object, propertyKey: string | symbol): void => {
        if (typeof propertyKey !== 'string')
            throw new Error('You can define a Column for only string properties');
        const entity = EntityDefinition.attach(target.constructor);
        const fn = target.constructor.prototype[propertyKey]
        if (typeof fn !== 'function')
            throw new Error('Property must be a function');
        entity.afterUpdate(fn);
    }
}

export function AfterRemove(): PropertyDecorator {
    return (target: Object, propertyKey: string | symbol): void => {
        if (typeof propertyKey !== 'string')
            throw new Error('You can define a Column for only string properties');
        const entity = EntityDefinition.attach(target.constructor);
        const fn = target.constructor.prototype[propertyKey]
        if (typeof fn !== 'function')
            throw new Error('Property must be a function');
        entity.afterRemove(fn);
    }
}
