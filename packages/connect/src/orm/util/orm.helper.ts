import {Type} from 'ts-gems';
import {AssociationElementMetadata} from '../model/association-element-metadata';
import type {ColumnElementMetadata} from '../model/column-element-metadata';
import {EmbeddedElementMetadata} from '../model/embedded-element-metadata';
import type {EntityMetadata} from '../model/entity-metadata';
import {ENTITY_METADATA_KEY} from '../orm.const';
import type {TypeResolver, TypeThunk} from '../orm.type';

export function isClass(fn: any): fn is Type {
    return typeof fn === 'function' && /^\s*class/.test(fn.toString());
}

export function isEntityClass(fn: any): fn is Type {
    return isClass(fn) && Reflect.hasMetadata(ENTITY_METADATA_KEY, fn);
}

export function isColumnElement(f: any): f is ColumnElementMetadata {
    return !!(f && f.name && f.kind === 'column');
}

export const isEmbeddedElement = (f: any): f is EmbeddedElementMetadata => {
    return !!(f && f.name && f.kind === 'object');
}

export const isAssociationElement = (f: any): f is AssociationElementMetadata => {
    return !!(f && f.name && f.kind === 'association');
}

export async function resolveEntity(ctorThunk: TypeThunk): Promise<Type | undefined> {
    if (typeof ctorThunk !== 'function')
        return;
    if (!isClass(ctorThunk))
        ctorThunk = await (ctorThunk as TypeResolver<any>)();
    if (isEntityClass(ctorThunk))
        return ctorThunk as Type;
}

export async function resolveEntityMeta(ctorThunk: TypeThunk): Promise<EntityMetadata | undefined> {
    const ctor = await resolveEntity(ctorThunk);
    return ctor && Reflect.getMetadata(ENTITY_METADATA_KEY, ctor);
}
