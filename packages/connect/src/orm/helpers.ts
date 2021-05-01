import 'reflect-metadata';
import type {ConstructorResolver, ConstructorThunk} from './types';
import type {Type} from '../types';
import type {EntityMeta} from './metadata/entity-meta';
import type {ColumnElementMeta} from './metadata/column-element-meta';
import type {EmbeddedElementMeta} from './metadata/embedded-element-meta';
import type {AssociationElementMeta} from './metadata/association-element-meta';
import {ENTITY_DEFINITION_KEY} from './consts';

export function isClass(fn: any): fn is Type {
    return typeof fn === 'function' && /^\s*class/.test(fn.toString());
}

export function isEntityClass(fn: any): fn is Type {
    return !!(isClass(fn) && fn[ENTITY_DEFINITION_KEY]);
}

export function isColumnElement(f: any): f is ColumnElementMeta {
    return !!(f && f.entity && f.kind === 'data');
}

export const isEmbeddedElement = (f: any): f is EmbeddedElementMeta => {
    return !!(f && f.entity && f.kind === 'embedded');
}

export const isAssociationElement = (f: any): f is AssociationElementMeta => {
    return !!(f && f.entity && f.kind === 'relation');
}

export async function resolveEntity(ctorThunk: ConstructorThunk): Promise<Type | undefined> {
    if (typeof ctorThunk !== 'function')
        return;
    if (!isClass(ctorThunk))
        ctorThunk = await (ctorThunk as ConstructorResolver<any>)();
    if (isEntityClass(ctorThunk))
        return ctorThunk as Type;
}

export async function resolveEntityMeta(ctorThunk: ConstructorThunk): Promise<EntityMeta | undefined> {
    const ctor = await resolveEntity(ctorThunk);
    return ctor && ctor.hasOwnProperty(ENTITY_DEFINITION_KEY) &&
        ctor[ENTITY_DEFINITION_KEY];
}
