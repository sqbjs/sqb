import type {EntityModel} from './entity-model';
import {ElementKind} from '../orm.type';
import {AbstractEntityElement} from './abstract-entity-element';
import type {AssociationNode} from './association-node';

export class EntityAssociationElement extends AbstractEntityElement {
    readonly kind: ElementKind = 'association';

    constructor(entity: EntityModel, name: string,
                readonly association: AssociationNode) {
        super(entity, name);
        this.association.name = this.entity.name + '.' + name;
    }

}
