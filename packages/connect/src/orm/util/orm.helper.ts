import {Type} from 'ts-gems';
import {AssociationElementMetadata} from '../interfaces/association-element-metadata';
import type {ColumnElementMetadata} from '../interfaces/column-element-metadata';
import {ComplexElementMetadata} from '../interfaces/complex-element-metadata';
import type {EntityModel} from '../model/entity-model';
import {ENTITY_METADATA_KEY} from '../orm.const';
import type {TypeResolver, TypeThunk} from '../orm.type';

export function isClass(fn: any): fn is Type {
    return typeof fn === 'function' && /^\s*class/.test(fn.toString());
}

export function isEntityClass(fn: any): fn is Type {
    return isClass(fn) && Reflect.hasMetadata(ENTITY_METADATA_KEY, fn);
}

export function isColumnElement(f: any): f is ColumnElementMetadata {
    return !!(f && f.entity && f.kind === 'column');
}

export const isObjectElement = (f: any): f is ComplexElementMetadata => {
    return !!(f && f.entity && f.kind === 'object');
}

export const isAssociationElement = (f: any): f is AssociationElementMetadata => {
    return !!(f && f.entity && f.kind === 'association');
}

export async function resolveEntity(ctorThunk: TypeThunk): Promise<Type | undefined> {
    if (typeof ctorThunk !== 'function')
        return;
    if (!isClass(ctorThunk))
        ctorThunk = await (ctorThunk as TypeResolver<any>)();
    if (isEntityClass(ctorThunk))
        return ctorThunk as Type;
}

export async function resolveEntityMeta(ctorThunk: TypeThunk): Promise<EntityModel | undefined> {
    const ctor = await resolveEntity(ctorThunk);
    return ctor && Reflect.getMetadata(ENTITY_METADATA_KEY, ctor);
}
