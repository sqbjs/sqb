import {DataType} from '@sqb/builder';
import {
    ColumnDefinition,
    DataColumnDefinition, GroupColumnDefinition, RelationColumnDefinition,
    isDataColumn, isGroupColumn, isRelationColumn
} from './ColumnDefinition';
import {Constructor, RelationColumnConfig, IndexConfig, ColumnConfig, GroupColumnConfig} from './orm.types';
import {Maybe} from '../types';
import {ENTITY_DEFINITION_KEY} from './consts';

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

    getGroupColumn(name: string): Maybe<GroupColumnDefinition> {
        if (!name)
            return;
        const col = this.columns.get(name.toUpperCase());
        return isGroupColumn(col) ? col : undefined;
    }

    defineDataColumn(propertyKey: string, options?: ColumnConfig): DataColumnDefinition {
        let col = this.getColumn(propertyKey);
        if (!col) {
            col = new DataColumnDefinition(this, propertyKey);
            this.columns.set(propertyKey.toUpperCase(), col);
            this.columnKeys.push(col.name);
        }
        if (!isDataColumn(col))
            throw new Error(`A ${col.kind} column for "${propertyKey}" already defined`);

        if (options) {
            if (options.fieldName)
                col.fieldName = options.fieldName;
            if (options.type) {
                col.type = options.type;
                if (col.type === Boolean)
                    col.dataType = DataType.BOOL;
                else if (col.type === String)
                    col.dataType = DataType.VARCHAR;
                else if (col.type === Number)
                    col.dataType = DataType.NUMBER;
                else if (col.type === Date)
                    col.dataType = DataType.TIMESTAMP;
                else if (col.type === Array) {
                    col.dataType = DataType.VARCHAR;
                    col.isArray = true;
                } else if (col.type === Buffer)
                    col.dataType = DataType.BINARY;
            }
            if (options.dataType)
                col.dataType = options.dataType;
            if (options.defaultValue != null)
                col.defaultValue = options.defaultValue;
            if (options.isArray != null)
                col.isArray = options.isArray;
            if (options.comment != null)
                col.comment = options.comment;
            if (options.collation != null)
                col.collation = options.collation;
            if (options.nullable != null)
                col.nullable = options.nullable;
            if (options.enum != null)
                col.enum = options.enum;
            if (options.length != null)
                col.length = options.length;
            if (options.precision != null)
                col.precision = options.precision;
            if (options.scale != null)
                col.scale = options.scale;
            if (options.autoGenerate != null)
                col.autoGenerate = options.autoGenerate;
            if (options.required != null)
                col.required = options.required;
            if (options.required != null)
                col.required = options.required;
            if (options.hidden != null)
                col.hidden = options.hidden;
            if (options.update != null)
                col.update = options.update;
            if (options.insert != null)
                col.insert = options.insert;
        }

        const reflectType = Reflect.getMetadata("design:type", this.ctor.prototype, propertyKey);
        if (reflectType === Array)
            col.isArray = true;

        if (!col.dataType) {
            col.type = reflectType;
            if (col.type === Boolean)
                col.dataType = DataType.BOOL;
            else if (col.type === String)
                col.dataType = DataType.VARCHAR;
            else if (col.type === Number)
                col.dataType = DataType.NUMBER;
            else if (col.type === Date)
                col.dataType = DataType.TIMESTAMP;
            else if (col.type === Array) {
                col.dataType = DataType.VARCHAR;
            } else if (col.type === Buffer)
                col.dataType = DataType.BINARY;
        }

        return col;
    }

    defineGroupColumn(propertyKey: string, cfg: GroupColumnConfig): GroupColumnDefinition {
        if (typeof cfg.type !== 'function')
            throw new Error('"type" must be defined');
        let col = this.getColumn(propertyKey);
        if (!col) {
            col = new GroupColumnDefinition(this, propertyKey, cfg.type);
            this.columns.set(propertyKey.toUpperCase(), col);
            this.columnKeys.push(col.name);
        }
        if (!isGroupColumn(col))
            throw new Error(`A ${col.kind} column for "${propertyKey}" already defined`);
        if (cfg.fieldNamePrefix != null)
            col.fieldNamePrefix = cfg.fieldNamePrefix;
        if (cfg.fieldNameSuffix != null)
            col.fieldNameSuffix = cfg.fieldNameSuffix;
        return col;
    }

    defineOne2OneRelation(column: string, cfg: RelationColumnConfig): RelationColumnDefinition {
        if (!(cfg && typeof cfg.target === 'function'))
            throw new Error('You must provide Entity constructor of a function that return Entity constructor');
        let col = this.getColumn(column);
        if (!col) {
            col = new RelationColumnDefinition(this, column, cfg);
            this.columns.set(column.toUpperCase(), col);
            this.columnKeys.push(col.name);
        }
        if (!isRelationColumn(col))
            throw new Error(`A ${col.kind} column for "${column}" already defined`);

        return col as RelationColumnDefinition;
    }

    defineOne2ManyRelation(column: string, cfg: RelationColumnConfig): RelationColumnDefinition {
        if (!(cfg && typeof cfg.target === 'function'))
            throw new Error('You must provide Entity constructor of a function that return Entity constructor');
        let col = this.getColumn(column);
        if (!col) {
            col = new RelationColumnDefinition(this, column, cfg, true);
            this.columns.set(column.toUpperCase(), col);
            this.columnKeys.push(col.name);
        }
        if (!isRelationColumn(col))
            throw new Error(`A ${col.kind} column for "${column}" already defined`);
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
        return ctor.hasOwnProperty(ENTITY_DEFINITION_KEY) &&
            ctor[ENTITY_DEFINITION_KEY];
    }

    static getColumnNames<T extends Function, K extends keyof T>(ctor: T): K[] | undefined {
        const def = this.get(ctor);
        return def && [...def.columnKeys] as K[];
    }

    static getOwnColumnNames<T extends Function, K extends keyof T>(ctor: T): K[] | undefined {
        const def = this.get(ctor);
        if (def) {
            const out: K[] = [];
            for (const k of def.columnKeys) {
                const col = def.getColumn(k);
                if (isDataColumn(col)) {
                    out.push(k as K);
                }
            }
            return out.length ? out : undefined;
        }
    }

    static getInsertColumnNames<T extends Function, K extends keyof T>(ctor: T): K[] | undefined {
        const def = this.get(ctor);
        if (def) {
            const out: K[] = [];
            for (const k of def.columnKeys) {
                const col = def.getColumn(k);
                if (isDataColumn(col) && (col.insert || col.insert == null)) {
                    out.push(k as K);
                }
            }
            return out.length ? out : undefined;
        }
    }

    static getUpdateColumnNames<T extends Function, K extends keyof T>(ctor: T): K[] | undefined {
        const def = this.get(ctor);
        if (def) {
            const out: K[] = [];
            for (const k of def.columnKeys) {
                const col = def.getColumn(k);
                if (isDataColumn(col) && (col.update || col.update == null)) {
                    out.push(k as K);
                }
            }
            return out.length ? out : undefined;
        }
    }

}
