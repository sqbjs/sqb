import type {EntityModel} from '../model/entity-model';
import type {ElementKind} from '../orm.type';

export interface ElementMetadata {
    readonly entity: EntityModel;
    readonly name: string;
    readonly kind: ElementKind;
}
