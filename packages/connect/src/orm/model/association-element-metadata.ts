import {AssociationNode} from './association-node';
import {ElementMetadata} from './element-metadata';
import type {EntityMetadata} from './entity-metadata';

export interface AssociationElementMetadata extends ElementMetadata {
    readonly kind: 'association';
    readonly association: AssociationNode
}

export namespace AssociationElementMetadata {

    export function create(entity: EntityMetadata, name: string, association: AssociationNode): AssociationElementMetadata {
        return {
            kind: 'association',
            entity,
            name,
            association
        }
    }

}
