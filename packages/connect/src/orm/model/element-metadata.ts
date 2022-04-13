import type {ElementKind} from '../orm.type';
import type {EntityMetadata} from './entity-metadata';

export interface ElementMetadata {
    readonly entity: EntityMetadata;
    readonly name: string;
    readonly kind: ElementKind;
}
