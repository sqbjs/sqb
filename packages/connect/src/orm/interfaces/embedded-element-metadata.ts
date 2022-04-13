import type {EntityModel} from '../model/entity-model';
import {TypeThunk} from '../orm.type';
import {resolveEntityMeta} from '../util/orm.helper';
import {ElementMetadata} from './element-metadata';

export interface EmbeddedElementMetadata extends ElementMetadata {
    readonly kind: 'object';
    type: TypeThunk;
    fieldNamePrefix?: string;
    fieldNameSuffix?: string;
}

export namespace EmbeddedElementMetadata {

    export function create(entity: EntityModel, name: string, type: TypeThunk): EmbeddedElementMetadata {
        return {
            kind: 'object',
            entity,
            name,
            type
        }
    }

    export async function resolveType(meta: EmbeddedElementMetadata): Promise<EntityModel> {
        const typ = await resolveEntityMeta(meta.type);
        if (typ)
            return typ;
        throw new Error(`Can't resolve type of ${meta.entity.name}.${meta.name}`);
    }

}
