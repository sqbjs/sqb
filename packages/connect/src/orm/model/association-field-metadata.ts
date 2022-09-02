import {AssociationNode} from './association-node.js';
import {EntityMetadata} from './entity-metadata.js';
import {FieldMetadata} from './field-metadata.js';

export interface AssociationFieldMetadata extends FieldMetadata {
    readonly kind: 'association';
    readonly association: AssociationNode
}

export namespace AssociationFieldMetadata {

    export function create(entity: EntityMetadata, name: string, association: AssociationNode): AssociationFieldMetadata {
        return {
            kind: 'association',
            entity,
            name,
            association
        }
    }

}
