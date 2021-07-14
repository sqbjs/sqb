import type {EntityModel} from './entity-model';
import {ElementKind} from '../orm.type';
import {AbstractEntityelement} from './abstract-entityelement';
import type {AssociationNode} from './association-node';

export class EntityAssociationElement extends AbstractEntityelement {
    readonly kind: ElementKind = 'association';

    constructor(entity: EntityModel, name: string,
                readonly association: AssociationNode) {
        super(entity, name);
        this.association.name = this.entity.name + '.' + name;
    }

}
