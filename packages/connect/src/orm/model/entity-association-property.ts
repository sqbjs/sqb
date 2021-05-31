import type {EntityModel} from './entity-model';
import {ElementKind} from '../orm.type';
import {AbstractEntityProperty} from './abstract-entity-property';
import type {AssociationNode} from './association-node';

export class EntityAssociationProperty extends AbstractEntityProperty {
    readonly kind: ElementKind = 'relation';

    constructor(entity: EntityModel, name: string,
                readonly association: AssociationNode) {
        super(entity, name);
        this.association.name = this.entity.name + '.' + name;
    }

}
