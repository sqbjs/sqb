import 'reflect-metadata';
import {EntityMeta} from './metadata/entity-meta';
import {ConstructorResolver, ConstructorThunk} from './types';
import {ENTITY_DEFINITION_KEY} from './consts';
import {Type} from '../types';

export function isClass(fn: any): fn is Type {
    return typeof fn === 'function' && /^\s*class/.test(fn.toString());
}

export function isEntityClass(fn: any): fn is Type {
    return !!(isClass(fn) && fn[ENTITY_DEFINITION_KEY]);
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
    const entity = await resolveEntity(ctorThunk);
    return entity && EntityMeta.get(entity);
}
