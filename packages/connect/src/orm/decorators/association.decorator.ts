import {ConstructorThunk} from '../types';
import {EntityMeta} from '../metadata/entity-meta';
import {AssociationBuilder} from '../metadata/association-builder';
import {Type} from '../../types';

export function Association(builder: AssociationBuilder<any>): PropertyDecorator {
    return (target: Object, propertyKey: string | symbol): void => {
        if (typeof propertyKey !== 'string')
            throw new Error('You can define a column for only string properties');
        if (builder.first.returnsMany() &&
            Reflect.getMetadata("design:type", target, propertyKey) !== Array)
            throw new Error(`Returning type of property (${propertyKey}) must be an array`);
        const entity = EntityMeta.attachTo(target.constructor as Type);
        builder.first.source = entity.ctor;
        entity.defineAssociationElement(propertyKey, builder.first);
    }
}

export function HasOne(type?: ConstructorThunk): PropertyDecorator {
    return (target: any, propertyKey: string | symbol): void => {
        type = type || Reflect.getMetadata("design:type", target, propertyKey);
        if (!type || type === Array)
            throw new Error('You must provide "type"');
        const builder = new AssociationBuilder(type, 'has-one');
        Association(builder)(target, propertyKey);
    }
}

export function HasMany(type: ConstructorThunk): PropertyDecorator {
    return (target: any, propertyKey: string | symbol): void => {
        type = type || Reflect.getMetadata("design:type", target, propertyKey);
        if (!type || type === Array)
            throw new Error('You must provide "type"');
        const builder = new AssociationBuilder(type, 'has-many');
        Association(builder)(target, propertyKey);
    }
}

/**
 * Crates an Link Chain Builder object
 */
export function hasOne<T>(type: ConstructorThunk<T>,
                          targetColumn?: keyof T,
                          sourceColumn?: string): AssociationBuilder<T> {
    return new AssociationBuilder<T>(type, 'has-one', targetColumn, sourceColumn);
}

/**
 * Crates an Link Chain Builder object
 */
export function hasMany<T>(type: ConstructorThunk<T>,
                           targetColumn?: keyof T,
                           sourceColumn?: string): AssociationBuilder<T> {
    return new AssociationBuilder<T>(type, 'has-many', targetColumn, sourceColumn);
}

/**
 * Crates an Link Chain Builder object
 */
export function belongsTo<T>(type: ConstructorThunk<T>,
                          targetColumn?: keyof T,
                          sourceColumn?: string): AssociationBuilder<T> {
    return new AssociationBuilder<T>(type, 'belongs-to', targetColumn, sourceColumn);
}
