import type {EntityMeta} from './entity-meta';
import {ElementKind, RelationColumnOptions} from '../types';
import {AbstractElementMeta} from './abstract-element-meta';
import type {EntityChainRing} from './entity-chain-ring';

export class RelationElementMeta extends AbstractElementMeta {
    readonly kind: ElementKind = 'relation';
    readonly hasMany?: boolean;
    readonly lazy?: boolean;

    constructor(entity: EntityMeta, name: string,
                readonly chain: EntityChainRing,
                options?: RelationColumnOptions) {
        super(entity, name);
        this.hasMany = !!(options?.hasMany);
        this.lazy = !!(options?.lazy);
        this.chain.name = this.entity.name + '.' + name;
    }

}
