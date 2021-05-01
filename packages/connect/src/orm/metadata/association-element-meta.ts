import type {EntityMeta} from './entity-meta';
import {ElementKind} from '../types';
import {AbstractElementMeta} from './abstract-element-meta';
import type {AssociationNode} from './association-node';

export class AssociationElementMeta extends AbstractElementMeta {
    readonly kind: ElementKind = 'relation';

    constructor(entity: EntityMeta, name: string,
                readonly association: AssociationNode) {
        super(entity, name);
        this.association.name = this.entity.name + '.' + name;
    }

}
