import type {EntityModel} from './entity-model';
import {ElementKind} from '../orm.type';

export abstract class AbstractEntityProperty {

    readonly entity: EntityModel;
    readonly name: string;
    abstract kind: ElementKind;

    protected constructor(entity: EntityModel, name: string) {
        this.entity = entity;
        this.name = name;
    }

}
