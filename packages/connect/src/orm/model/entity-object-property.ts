import _ from 'lodash';
import {ElementKind, TypeThunk, DataPropertyOptions} from '../orm.type';
import {AbstractEntityProperty} from './abstract-entity-property';
import {EntityModel} from './entity-model';
import {resolveEntityMeta} from '../orm.helper';

export class EntityObjectProperty extends AbstractEntityProperty {
    kind: ElementKind = 'embedded';
    type: TypeThunk;
    fieldNamePrefix?: string;
    fieldNameSuffix?: string;

    constructor(entity: EntityModel, name: string,
                type: TypeThunk) {
        super(entity, name);
        this.type = type;
    }

    async resolveType(): Promise<EntityModel> {
        const typ = await resolveEntityMeta(this.type);
        if (typ)
            return typ;
        throw new Error(`Can't resolve type of ${this.entity.name}.${this.name}`);
    }

    assign(options: DataPropertyOptions) {
        Object.assign(this, _.omit(options, ['entity', 'name', 'kind']));
    }

}
