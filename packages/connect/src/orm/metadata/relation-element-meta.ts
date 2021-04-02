import _ from 'lodash';
import type {EntityMeta} from './entity-meta';
import {ElementKind, ConstructorThunk, RelationColumnOptions, DataColumnOptions} from '../types';
import {AbstractElementMeta} from './abstract-element-meta';
import {ForeignKeyMeta} from '../metadata/foreign-key-meta';

export const isRelationElement = (f: any): f is RelationElementMeta => {
    return !!(f && f instanceof AbstractElementMeta && f.kind === 'relation');
}

export class RelationElementMeta extends AbstractElementMeta {
    readonly kind: ElementKind = 'relation';
    readonly foreign: ForeignKeyMeta;
    readonly hasMany?: boolean;
    readonly lazy?: boolean;

    constructor(entity: EntityMeta, name: string,
                target: ConstructorThunk,
                options?: RelationColumnOptions) {
        super(entity, name);
        this.foreign = new ForeignKeyMeta(entity, target,
            (entity.name + '.' + name), options);
        this.hasMany = !!(options?.hasMany);
        this.lazy = !!(options?.lazy);
    }

    get target(): ConstructorThunk {
        return this.foreign.target;
    }

    get keyColumn(): string | undefined {
        return this.foreign.keyColumn;
    }

    get targetColumn(): string | undefined {
        return this.foreign.targetColumn;
    }

    assign(options: DataColumnOptions) {
        Object.assign(this, _.omit(options, ['entity', 'name', 'kind']));
    }

}
