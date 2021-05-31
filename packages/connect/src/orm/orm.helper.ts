import 'reflect-metadata';
import type {TypeResolver, TypeThunk} from './orm.type';
import type {Type} from '../types';
import type {EntityModel} from './model/entity-model';
import type {EntityDataProperty} from './model/entity-data-property';
import type {EntityObjectProperty} from './model/entity-object-property';
import type {EntityAssociationProperty} from './model/entity-association-property';
import {ENTITY_DEFINITION_KEY} from './orm.const';

export function isClass(fn: any): fn is Type {
    return typeof fn === 'function' && /^\s*class/.test(fn.toString());
}

export function isEntityClass(fn: any): fn is Type {
    return !!(isClass(fn) && fn[ENTITY_DEFINITION_KEY]);
}

export function isDataProperty(f: any): f is EntityDataProperty {
    return !!(f && f.entity && f.kind === 'data');
}

export const isObjectProperty = (f: any): f is EntityObjectProperty => {
    return !!(f && f.entity && f.kind === 'embedded');
}

export const isAssociationElement = (f: any): f is EntityAssociationProperty => {
    return !!(f && f.entity && f.kind === 'relation');
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
    return ctor && ctor.hasOwnProperty(ENTITY_DEFINITION_KEY) &&
        ctor[ENTITY_DEFINITION_KEY];
}
