import _ from 'lodash';
import {ElementKind, ConstructorThunk, DataColumnOptions} from '../types';
import {AbstractElementMeta} from './abstract-element-meta';
import {EntityMeta} from './entity-meta';
import {resolveEntityMeta} from '../helpers';

export const isEmbeddedElement = (f: any): f is EmbeddedElementMeta => {
    return !!(f && f instanceof AbstractElementMeta && f.kind === 'embedded');
}

export class EmbeddedElementMeta extends AbstractElementMeta {
    kind: ElementKind = 'embedded';
    type: ConstructorThunk;
    fieldNamePrefix?: string;
    fieldNameSuffix?: string;

    constructor(entity: EntityMeta, name: string,
                type: ConstructorThunk) {
        super(entity, name);
        this.type = type;
    }

    async resolveType(): Promise<EntityMeta> {
        const typ = await resolveEntityMeta(this.type);
        if (typ)
            return typ;
        throw new Error(`Can't resolve type of ${this.entity.name}.${this.name}`);
    }

    assign(options: DataColumnOptions) {
        Object.assign(this, _.omit(options, ['entity', 'name', 'kind']));
    }

}
