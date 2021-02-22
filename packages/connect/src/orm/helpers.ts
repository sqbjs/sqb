import 'reflect-metadata';
import {EntityMeta} from './metadata/entity-meta';
import {Constructor, ConstructorResolver, ConstructorThunk} from './types';
import {ENTITY_DEFINITION_KEY} from './consts';

export function isClass(fn: any): fn is Constructor {
    return typeof fn === 'function' && /^\s*class/.test(fn.toString());
}

export function isEntityClass(fn: any): fn is Constructor {
    return !!(isClass(fn) && fn[ENTITY_DEFINITION_KEY]);
}

export async function resolveEntity(ctorThunk: ConstructorThunk): Promise<Constructor | undefined> {
    if (typeof ctorThunk !== 'function')
        return;
    if (!isClass(ctorThunk))
        ctorThunk = await (ctorThunk as ConstructorResolver<any>)();
    if (isEntityClass(ctorThunk))
        return ctorThunk as Constructor;
}

export async function resolveEntityMeta(ctorThunk: ConstructorThunk): Promise<EntityMeta | undefined> {
    const entity = await resolveEntity(ctorThunk);
    return entity && EntityMeta.get(entity);
}
