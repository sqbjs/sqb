import {AssociationNode} from './association-node.js';
import {ElementMetadata} from './element-metadata.js';
import type {EntityMetadata} from './entity-metadata.js';

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
