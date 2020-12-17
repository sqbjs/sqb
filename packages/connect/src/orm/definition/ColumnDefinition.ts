import type {EntityDefinition} from './EntityDefinition';
import {
    AutoGenerationStrategy,
    Constructor,
    ConstructorThunk,
    RelationColumnConfig
} from '../types';
import {Maybe} from '../../types';
import {getEntityDefinition, isEntityClass} from '../helpers';

export type ColumnKind = 'data' | 'relation';
export type ColumnDefinition = DataColumnDefinition | RelationColumnDefinition;

export const isDataColumn = (f: Maybe<BaseColumnDefinition>): f is DataColumnDefinition => {
    return !!(f && f.kind === 'data');
}

export const isRelationColumn = (f: Maybe<BaseColumnDefinition>): f is RelationColumnDefinition => {
    return !!(f && f.kind === 'relation');
}

export abstract class BaseColumnDefinition {

    abstract kind: ColumnKind;
    readonly entity: EntityDefinition;
    readonly name: string;

    protected constructor(entity: EntityDefinition, name: string) {
        this.entity = entity;
        this.name = name;
    }

}

export class DataColumnDefinition extends BaseColumnDefinition {
    kind: ColumnKind = 'data';
    fieldName: string;
    comment?: string;
    defaultValue: any;
    type: string;
    isArray?: boolean;
    enum?: (string | number)[] | Object;
    length?: number;
    nullable?: boolean;
    precision?: number;
    scale?: number;
    collation?: string;
    autoGenerate?: AutoGenerationStrategy;
    sortAscending?: boolean;
    sortDescending?: boolean;

    constructor(entity: EntityDefinition, name: string) {
        super(entity, name);
        this.fieldName = name;
        this.type = 'string';
    }
}

export class RelationColumnDefinition extends BaseColumnDefinition {
    kind: ColumnKind = 'relation';
    target: Constructor | ConstructorThunk;
    column: string[];
    targetColumn: string[];
    hasMany: boolean;
    lazy: boolean;

    constructor(entity: EntityDefinition, name: string,
                hasMany: boolean,
                cfg: RelationColumnConfig) {
        super(entity, name);
        this.target = cfg.target;
        this.column = Array.isArray(cfg.column) ? cfg.column : [cfg.column];
        this.hasMany = hasMany;
        this.lazy = !!cfg.lazy;
        this.targetColumn = Array.isArray(cfg.targetColumn) ? cfg.targetColumn : [cfg.targetColumn];
        if (this.column.length !== this.targetColumn.length)
            throw new Error(`"column" and "targetColumn" must contain same number of columns`);
    }

    async resolveTarget(): Promise<EntityDefinition> {
        if (isEntityClass(this.target))
            return getEntityDefinition(this.target);
        const ctor = await (this.target as ConstructorThunk)();
        return getEntityDefinition(ctor);
    }

}
