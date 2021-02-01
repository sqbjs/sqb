import {
    ColumnDefinition,
    DataColumnDefinition, isDataColumn, isRelationColumn,
    RelationColumnDefinition
} from './ColumnDefinition';
import {Constructor, RelationColumnConfig, IndexConfig} from './orm.types';
import {Maybe} from '../types';
import {ENTITY_DEFINITION_PROPERTY} from './consts';

export interface IndexDefinition {
    name?: string;
    column: string | string[];
    unique?: boolean;
}

export class EntityDefinition {
    name: string;
    tableName: string;
    columns = new Map<string, ColumnDefinition>();
    columnKeys: string[] = [];
    schema?: string;
    comment?: string;
    primaryIndex?: IndexDefinition;
    indexes: IndexDefinition[] = [];
    eventListeners: { event: string, fn: Function }[] = [];

    constructor(readonly ctor: Constructor) {
        this.name = ctor.name;
        this.tableName = ctor.name;
    }

    getColumn(name: string): Maybe<ColumnDefinition> {
        if (!name)
            return;
        return this.columns.get(name.toUpperCase());
    }

    getDataColumn(name: string): Maybe<DataColumnDefinition> {
        if (!name)
            return;
        const col = this.columns.get(name.toUpperCase());
        return isDataColumn(col) ? col : undefined;
    }

    getRelationColumn(name: string): Maybe<RelationColumnDefinition> {
        if (!name)
            return;
        const col = this.columns.get(name.toUpperCase());
        return isRelationColumn(col) ? col : undefined;
    }

    addDataColumn(column: string): DataColumnDefinition {
        let col = this.getColumn(column);
        if (col && col.kind !== 'data')
            throw new Error(`A ${col.kind} column for "${column}" already defined`);
        if (!col) {
            col = new DataColumnDefinition(this, column);
            this.columns.set(column.toUpperCase(), col);
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
            this.columns.set(column.toUpperCase(), col);
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
            this.columns.set(column.toUpperCase(), col);
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
        this.eventListeners.push({event: 'before-insert', fn});
    }

    beforeUpdate(fn: Function): void {
        this.eventListeners.push({event: 'before-update', fn});
    }

    beforeDestroy(fn: Function): void {
        this.eventListeners.push({event: 'before-destroy', fn});
    }

    afterInsert(fn: Function): void {
        this.eventListeners.push({event: 'after-insert', fn});
    }

    afterUpdate(fn: Function): void {
        this.eventListeners.push({event: 'after-update', fn});
    }

    afterDestroy(fn: Function): void {
        this.eventListeners.push({event: 'after-destroy', fn});
    }

    static get(ctor: Function): EntityDefinition {
        return ctor.hasOwnProperty(ENTITY_DEFINITION_PROPERTY) &&
            ctor[ENTITY_DEFINITION_PROPERTY];
    }

    static getElementNames(ctor: Function): string[] | undefined {
        const def = this.get(ctor);
        return def && [...def.columnKeys];
    }

    static getOwnElementNames(ctor: Function): string[] | undefined {
        const def = this.get(ctor);
        if (def) {
            const out: string[] = [];
            for (const k of def.columnKeys) {
                const col = def.getColumn(k);
                if (isDataColumn(col)) {
                    out.push(k);
                }
            }
            return out.length ? out : undefined;
        }
    }

}
