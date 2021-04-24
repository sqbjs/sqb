import _ from 'lodash';
import {ElementKind, ConstructorThunk, ColumnOptions} from '../types';
import {AbstractElementMeta} from './abstract-element-meta';
import {EntityMeta} from './entity-meta';
import {resolveEntityMeta} from '../helpers';

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

    assign(options: ColumnOptions) {
        Object.assign(this, _.omit(options, ['entity', 'name', 'kind']));
    }

}
