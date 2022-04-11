import {AssociationNode} from '../model/association-node';
import type {EntityModel} from '../model/entity-model';
import {ElementMetadata} from './element-metadata';

export interface AssociationElementMetadata extends ElementMetadata {
    readonly kind: 'association';
    readonly association: AssociationNode
}

export namespace AssociationElementMetadata {

    export function create(entity: EntityModel, name: string, association: AssociationNode): AssociationElementMetadata {
        return {
            kind: 'association',
            entity,
            name,
            association
        }
    }

}
