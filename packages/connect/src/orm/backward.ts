// Backward compatibility
import {PickWritable, Type} from 'ts-gems';
import {Entity} from './decorators/entity.decorator';

export function getInsertColumnNames<T, K extends keyof PickWritable<T>>(ctor: Type<T>): K[] {
    return Entity.getInsertColumnNames(ctor) as K[];
}

export function getUpdateColumnNames<T, K extends keyof PickWritable<T>>(ctor: Type<T>): K[] {
    return Entity.getUpdateColumnNames(ctor) as K[];
}

export function getNonAssociationElementNames<T, K extends keyof PickWritable<T>>(ctor: Type<T>): K[] {
    return Entity.getNonAssociationElementNames(ctor) as K[];
}

export const OmitEntity = Entity.Omit;
export const PickEntity = Entity.Pick;
export const UnionEntity = Entity.Union;
