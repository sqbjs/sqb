import {TypeThunk} from '../orm.type';
import {resolveEntityMeta} from '../util/orm.helper';
import {ElementMetadata} from './element-metadata';
import type {EntityMetadata} from './entity-metadata';

export type EmbeddedElementOptions = Partial<Omit<EmbeddedElementMetadata, 'entity' | 'name' | 'kind' | 'type'>>;

export interface EmbeddedElementMetadata extends ElementMetadata {
    readonly kind: 'object';
    type: TypeThunk;
    fieldNamePrefix?: string;
    fieldNameSuffix?: string;
}

export namespace EmbeddedElementMetadata {

    export function create(entity: EntityMetadata, name: string, type: TypeThunk, options?: EmbeddedElementOptions): EmbeddedElementMetadata {
        const result: EmbeddedElementMetadata = {
            kind: 'object',
            entity,
            name,
            type
        }
        if (options?.fieldNamePrefix)
            result.fieldNamePrefix = options.fieldNamePrefix;
        if (options?.fieldNameSuffix)
            result.fieldNameSuffix = options.fieldNameSuffix;
        return result;
    }

    export async function resolveType(meta: EmbeddedElementMetadata): Promise<EntityMetadata> {
        const typ = await resolveEntityMeta(meta.type);
        if (typ)
            return typ;
        throw new Error(`Can't resolve type of ${meta.entity.name}.${meta.name}`);
    }

}
