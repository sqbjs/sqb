import {
    ColumnDefinition,
    DataColumnDefinition, isDataColumn, isRelationColumn,
    RelationColumnDefinition
} from './ColumnDefinition';
import {RelationColumnConfig, IndexConfig, Constructor} from '../types';
import {Maybe} from '../../types';
import {ENTITY_DEFINITION_PROPERTY} from '../consts';

export interface IndexDefinition {
    name?: string;
    column: string | string[];
    unique?: boolean;
}

export interface EntityDefinitionOptions {
    columnsCaseSensitive?: boolean;
}

export class EntityDefinition {

    readonly columnsCaseSensitive: boolean;
    name;
    tableName;
    readonly columns = new Map<string, ColumnDefinition>();
    readonly columnKeys: string[] = [];
    schema?: string;
    comment?: string;
    primaryIndex?: IndexDefinition;
    indexes: IndexDefinition[] = [];
    eventListeners: { event: string, fn: Function }[] = [];

    constructor(readonly ctor: Constructor, options?: EntityDefinitionOptions) {
        this.name = ctor.name;
        this.tableName = ctor.name;
        this.columnsCaseSensitive = !!(options && options.columnsCaseSensitive);
    }

    getColumn(name: string): Maybe<ColumnDefinition> {
        if (!name)
            return;
        return this.columns.get(this.columnsCaseSensitive ? name : name.toUpperCase());
    }

    getDataColumn(name: string): Maybe<DataColumnDefinition> {
        if (!name)
            return;
        const col = this.columns.get(this.columnsCaseSensitive ? name : name.toUpperCase());
        return isDataColumn(col) ? col : undefined;
    }

    getRelationColumn(name: string): Maybe<RelationColumnDefinition> {
        if (!name)
            return;
        const col = this.columns.get(this.columnsCaseSensitive ? name : name.toUpperCase());
        return isRelationColumn(col) ? col : undefined;
    }

    addDataColumn(column: string): DataColumnDefinition {
        let col = this.getColumn(column);
        if (col && col.kind !== 'data')
            throw new Error(`A ${col.kind} column for "${column}" already defined`);
        if (!col) {
            col = new DataColumnDefinition(this, column);
            this.columns.set(this.columnsCaseSensitive ? column : column.toUpperCase(), col);
            this.columnKeys.push(col.name);
        }
        return col as DataColumnDefinition;
    }

    addOne2OneRelation(column: string, cfg: RelationColumnConfig): RelationColumnDefinition {
        let col = this.getColumn(column);
        if (col && col.kind !== 'relation')
            throw new Error(`A ${col.kind} column for "${column}" already defined`);
        if (typeof cfg.target !== 'function')
            throw new Error('You must provide Entity constructor of a function that return Entity constructor');
        if (!col) {
            col = new RelationColumnDefinition(this, column, cfg);
            this.columns.set(this.columnsCaseSensitive ? column : column.toUpperCase(), col);
            this.columnKeys.push(col.name);
        }
        return col as RelationColumnDefinition;
    }

    addOne2ManyRelation(column: string, cfg: RelationColumnConfig): RelationColumnDefinition {
        let col = this.getColumn(column);
        if (col && col.kind !== 'relation')
            throw new Error(`A ${col.kind} column for "${column}" already defined`);
        if (typeof cfg.target !== 'function')
            throw new Error('You must provide Entity constructor of a function that return Entity constructor');
        if (!col) {
            col = new RelationColumnDefinition(this, column, cfg, true);
            this.columns.set(this.columnsCaseSensitive ? column : column.toUpperCase(), col);
            this.columnKeys.push(col.name);
        }
        return col as RelationColumnDefinition;
    }

    definePrimaryIndex(column: string | string[], options?: IndexConfig): void {
        if (!(typeof column === 'string' || Array.isArray(column)))
            throw new Error('You must specify primary index field(s)');
        if (Array.isArray(column) && column.length === 1)
            column = column[0];
        const def: IndexDefinition = this.primaryIndex = {column, unique: true};
        if (options?.name)
            def.name = options.name;
    }

    defineIndex(column: string | string[], options?: IndexConfig): void {
        if (!(typeof column === 'string' || Array.isArray(column)))
            throw new Error('You must specify index field(s)');
        if (Array.isArray(column) && column.length === 1)
            column = column[0];
        const def: IndexDefinition = {column};
        if (options?.name)
            def.name = options.name;
        if (options?.unique)
            def.unique = options.unique;
        this.indexes.push(def);
    }

    beforeInsert(fn: Function): void {
        this.eventListeners.push({event: 'beforeinsert', fn});
    }

    beforeUpdate(fn: Function): void {
        this.eventListeners.push({event: 'beforeupdate', fn});
    }

    beforeRemove(fn: Function): void {
        this.eventListeners.push({event: 'beforeremove', fn});
    }

    afterInsert(fn: Function): void {
        this.eventListeners.push({event: 'afterinsert', fn});
    }

    afterUpdate(fn: Function): void {
        this.eventListeners.push({event: 'afterupdate', fn});
    }

    afterRemove(fn: Function): void {
        this.eventListeners.push({event: 'afterremove', fn});
    }

    static get(ctor: Function): EntityDefinition {
        return ctor[ENTITY_DEFINITION_PROPERTY];
    }

    static attach(ctor: Function): EntityDefinition {
        let entity: EntityDefinition = EntityDefinition.get(ctor);
        if (entity)
            return entity;
        ctor[ENTITY_DEFINITION_PROPERTY] = entity = new EntityDefinition(ctor as Constructor);
        return entity;
    }

}
