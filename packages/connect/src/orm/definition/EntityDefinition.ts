import {ColumnDefinition} from './ColumnDefinition';
import {IndexOptions} from '../types';
import {Maybe} from '../../types';

export const ENTITY_METADATA_PROPERTY = Symbol.for('sqb.entity-metadata');

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

    constructor(name: string, options?: EntityDefinitionOptions) {
        this.name = name;
        this.tableName = name;
        this.columnsCaseSensitive = !!(options && options.columnsCaseSensitive);
    }

    getColumn(name: string): Maybe<ColumnDefinition> {
        if (!name)
            return;
        return this.columns.get(this.columnsCaseSensitive ? name : name.toUpperCase());
    }

    addColumn(name: string): ColumnDefinition {
        let col = this.getColumn(name);
        if (!col) {
            col = new ColumnDefinition(this, name);
            this.columns.set(this.columnsCaseSensitive ? name : name.toUpperCase(), col);
            this.columnKeys.push(col.name);
        }
        return col;
    }

    definePrimaryIndex(column: string | string[], options?: IndexOptions): void {
        if (!(typeof column === 'string' || Array.isArray(column)))
            throw new Error('You must specify primary index field(s)');
        if (Array.isArray(column) && column.length === 1)
            column = column[0];
        const def: IndexDefinition = this.primaryIndex = {column, unique: true};
        if (options?.name)
            def.name = options.name;
    }

    defineIndex(column: string | string[], options?: IndexOptions): void {
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
        return ctor[ENTITY_METADATA_PROPERTY];
    }

    static attach(ctor: Function): EntityDefinition {
        let entity: EntityDefinition = EntityDefinition.get(ctor);
        if (entity)
            return entity;
        ctor[ENTITY_METADATA_PROPERTY] = entity = new EntityDefinition(ctor.name);
        return entity;
    }

}
