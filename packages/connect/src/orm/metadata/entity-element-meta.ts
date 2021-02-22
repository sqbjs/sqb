import type {EntityMeta} from './entity-meta';
import {ElementKind} from '../types';

export abstract class EntityElementMeta {

    readonly entity: EntityMeta;
    readonly name: string;
    abstract kind: ElementKind;

    protected constructor(entity: EntityMeta, name: string) {
        this.entity = entity;
        this.name = name;
    }

}
