import type {ElementKind} from '../orm.type.js';
import type {EntityMetadata} from './entity-metadata.js';

export interface ElementMetadata {
    readonly entity: EntityMetadata;
    readonly name: string;
    readonly kind: ElementKind;
}
