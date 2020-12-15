import {EntityDefinition} from './definition/EntityDefinition';
import {Constructor} from './types';
import {ENTITY_DEFINITION_PROPERTY} from './consts';

export function isClass(fn: Function): fn is Constructor {
    return typeof fn === 'function' && /^\s*class/.test(fn.toString());
}

export function isEntityClass(fn: Function): fn is Constructor {
    return !!(isClass(fn) && fn[ENTITY_DEFINITION_PROPERTY]);
}

export function getEntityDefinition(fn: Function): EntityDefinition {
    return fn[ENTITY_DEFINITION_PROPERTY];
}
