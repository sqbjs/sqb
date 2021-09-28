import 'reflect-metadata';
import {Type} from 'ts-gems';
import type {TypeResolver, TypeThunk} from '../orm.type';
import type {EntityModel} from '../model/entity-model';
import type {EntityColumnElement} from '../model/entity-column-element';
import type {EntityObjectElement} from '../model/entity-object-element';
import type {EntityAssociationElement} from '../model/entity-association-element';
import {ENTITY_DEFINITION_KEY} from '../orm.const';

export function isClass(fn: any): fn is Type {
    return typeof fn === 'function' && /^\s*class/.test(fn.toString());
}

export function isEntityClass(fn: any): fn is Type {
    return !!(isClass(fn) && fn[ENTITY_DEFINITION_KEY]);
}

export function isColumnElement(f: any): f is EntityColumnElement {
    return !!(f && f.entity && f.kind === 'column');
}

export const isObjectElement = (f: any): f is EntityObjectElement => {
    return !!(f && f.entity && f.kind === 'object');
}

export const isAssociationElement = (f: any): f is EntityAssociationElement => {
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
    return ctor && ctor[ENTITY_DEFINITION_KEY];
}
