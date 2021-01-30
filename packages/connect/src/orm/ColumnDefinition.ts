import type {EntityDefinition} from './EntityDefinition';
import {
    ColumnAutoGenerationStrategy,
    ConstructorThunk,
    ColumnTransformFunction,
    RelationColumnConfig,
    ConstructorResolver
} from './orm.types';
import {Maybe} from '../types';
import {getEntityDefinition, isEntityClass} from './helpers';
import {DataType} from '@sqb/builder';

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
    type?: Function;
    comment?: string;
    defaultValue: any;
    dataType?: DataType;
    isArray?: boolean;
    enum?: (string | number)[] | Object;
    length?: number;
    nullable?: boolean;
    precision?: number;
    scale?: number;
    collation?: string;
    autoGenerate?: ColumnAutoGenerationStrategy;
    required?: boolean;
    hidden?: boolean;
    update?: boolean;
    insert?: boolean;
    transformRead?: ColumnTransformFunction;
    transformWrite?: ColumnTransformFunction;

    constructor(entity: EntityDefinition, name: string) {
        super(entity, name);
        this.fieldName = name;
    }

    get canUpdate(): boolean {
        return this.update === undefined || this.update;
    }

    get canInsert(): boolean {
        return this.insert === undefined || this.insert;
    }
}

export class RelationColumnDefinition extends BaseColumnDefinition {
    kind: ColumnKind = 'relation';
    target: ConstructorThunk;
    column: string[];
    targetColumn: string[];
    hasMany: boolean;
    lazy: boolean;

    constructor(entity: EntityDefinition, name: string,
                cfg: RelationColumnConfig,
                hasMany = false) {
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
        const ctor = await (this.target as ConstructorResolver<any>)();
        const entity = getEntityDefinition(ctor);
        if (!entity)
            throw new Error(`Relation column "${this.name}" definition error. ` +
                `No valid target entity defined.`);
        return entity;
    }

    getColumns(): DataColumnDefinition[] {
        return this.column.map(c => {
            const col = this.entity.getDataColumn(c);
            if (!col)
                throw new Error(`Relation column "${this.name}" definition error. ` +
                    ` ${this.entity.name} has no data column named "${c}"`);
            return col;
        });
    }

    async resolveTargetColumns(): Promise<DataColumnDefinition[]> {
        const targetEntity = await this.resolveTarget();
        return this.targetColumn.map(c => {
            const col = targetEntity.getDataColumn(c);
            if (!col)
                throw new Error(`Relation column "${this.name}" definition error. ` +
                    ` ${targetEntity.name} has no data column named "${c}"`);
            return col;
        });
    }

}
