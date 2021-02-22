import {isRelationElement, RelationElementMeta} from './relation-element-meta';
import {
    Constructor,
    IndexOptions,
    ConstructorThunk, ForeignKeyOptions, RelationColumnOptions, DataColumnOptions,
} from '../types';
import {Maybe} from '../../types';
import {ENTITY_DEFINITION_KEY} from '../consts';
import {IndexMeta} from './index-meta';
import {ForeignKeyMeta} from './foreign-key-meta';
import {DataColumnMeta, isDataColumn} from './data-column-meta';
import {EmbeddedElementMeta, isEmbeddedElement} from './embedded-element-meta';
import {serializeColumn} from '../util/serialize-element';
import {DataType} from '@sqb/builder';

type ColumnMeta = DataColumnMeta | EmbeddedElementMeta | RelationElementMeta;

export class EntityMeta {
    name: string;
    tableName?: string;
    elements = new Map<string, ColumnMeta>();
    elementKeys: string[] = [];
    schema?: string;
    comment?: string;
    primaryIndex?: IndexMeta;
    indexes: IndexMeta[] = [];
    foreignKeys: ForeignKeyMeta[] = [];
    eventListeners: { event: string, fn: Function }[] = [];

    constructor(readonly ctor: Function) {
        this.name = ctor.name;
    }

    getColumn(name: string): Maybe<ColumnMeta> {
        if (!name)
            return;
        return this.elements.get(name.toLowerCase());
    }

    getDataColumn(name: string): Maybe<DataColumnMeta> {
        if (!name)
            return;
        const col = this.elements.get(name.toLowerCase());
        return isDataColumn(col) ? col : undefined;
    }

    getRelationColumn(name: string): Maybe<RelationElementMeta> {
        if (!name)
            return;
        const col = this.elements.get(name.toLowerCase());
        return isRelationElement(col) ? col : undefined;
    }

    getEmbeddedColumn(name: string): Maybe<EmbeddedElementMeta> {
        if (!name)
            return;
        const col = this.elements.get(name.toLowerCase());
        return isEmbeddedElement(col) ? col : undefined;
    }

    setDataColumn(name: string, options?: DataColumnOptions): DataColumnMeta {
        let col = this.getColumn(name);
        if (!col || !isDataColumn(col)) {
            col = new DataColumnMeta(this, name, options);
            if (!col.type)
                col.type = Reflect.getMetadata("design:type", this.ctor, name);
            if (!col.dataType) {
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
            if (!this.elements.has(name.toLowerCase()))
                this.elementKeys.push(name);
            this.elements.set(name.toLowerCase(), col);
        } else if (options)
            col.assign(options);
        return col;
    }

    setRelationColumn(name: string, target: ConstructorThunk,
                      options?: RelationColumnOptions): RelationElementMeta {
        if (typeof target !== 'function')
            throw new Error('"target" must be defined');
        if (options?.lazy) {
            const desc = Object.getOwnPropertyDescriptor(this.ctor.prototype, name);
            if (desc)
                delete this.ctor.prototype[name];
        }


        const col = new RelationElementMeta(this, name, target, options);
        if (!this.elements.has(name.toLowerCase()))
            this.elementKeys.push(name);
        this.elements.set(name.toLowerCase(), col);
        return col;
    }

    setEmbeddedElement(name: string, type: ConstructorThunk): EmbeddedElementMeta {
        if (typeof type !== 'function')
            throw new Error('"type" must be defined');

        let col = this.getColumn(name);
        if (!col || !isEmbeddedElement(col)) {
            col = new EmbeddedElementMeta(this, name, type);
            if (!this.elements.has(name.toLowerCase()))
                this.elementKeys.push(name);
            this.elements.set(name.toLowerCase(), col);
        }

        return col;
    }

    setPrimaryIndex(column: string | string[], options?: IndexOptions): void {
        this.primaryIndex = new IndexMeta(this, column, options);
    }

    addIndex(column: string | string[], options?: IndexOptions): void {
        this.indexes.push(new IndexMeta(this, column, options));
    }

    addForeignIndex(target: ConstructorThunk, options?: ForeignKeyOptions): void {
        const fk = new ForeignKeyMeta(this, target,
            this.name + '/ForeignIndex[' + (options?.name || this.foreignKeys.length) + ']',
            options);
        this.foreignKeys.push(fk);
    }

    addForeignKey(target: ConstructorThunk, keyColumn: string, options?: ForeignKeyOptions): void {
        const fk = new ForeignKeyMeta(this, target,
            this.name + '.' + keyColumn, options);
        this.foreignKeys.push(fk);
    }

    before(event: 'insert' | 'update' | 'destroy', fn: Constructor): void {
        this.eventListeners.push({event: 'before-' + event, fn});
    }

    after(event: 'insert' | 'update' | 'destroy', fn: Constructor): void {
        this.eventListeners.push({event: 'after-' + event, fn});
    }

    getDataColumnNames(): string[] {
        const out: string[] = [];
        for (const k of this.elementKeys) {
            const col = this.getColumn(k);
            if (isDataColumn(col))
                out.push(k);
        }
        return out;
    }

    getInsertColumnNames(): string[] {
        const out: string[] = [];
        for (const k of this.elementKeys) {
            const col = this.getColumn(k);
            if (isDataColumn(col) && !col.noInsert)
                out.push(k);
        }
        return out;
    }

    getUpdateColumnNames(): string[] {
        const out: string[] = [];
        for (const k of this.elementKeys) {
            const col = this.getColumn(k);
            if (isDataColumn(col) && !col.noUpdate)
                out.push(k);
        }
        return out;
    }

    static get(ctor: Function): EntityMeta {
        return ctor.hasOwnProperty(ENTITY_DEFINITION_KEY) &&
            ctor[ENTITY_DEFINITION_KEY];
    }

    static attachTo(ctor: Function) {
        let entity: EntityMeta = this.get(ctor);
        if (entity)
            return entity;
        ctor[ENTITY_DEFINITION_KEY] = entity = new EntityMeta(ctor);
        // Merge base entity columns into this one
        const baseCtor = Object.getPrototypeOf(ctor);
        const base = EntityMeta.get(baseCtor);
        if (base) {
            for (const k of base.elementKeys) {
                const col = base.elements.get(k.toLowerCase());
                if (col) {
                    entity.elementKeys.push(k);
                    entity.elements.set(k.toLowerCase(), col);
                }
            }
        }
        if (base.primaryIndex)
            entity.setPrimaryIndex([...base.primaryIndex.columns]);

        ctor.prototype.toJSON = function (): Object {
            const obj = {};
            const elementKeys = entity.elementKeys;
            const l = elementKeys.length;
            let key;
            let v;
            for (let i = 0; i < l; i++) {
                key = elementKeys[i]
                v = this[key];
                if (v === undefined)
                    continue;
                const col = entity.getColumn(key);
                if (col)
                    obj[key] = serializeColumn(col, v);
            }
            return obj;
        }
        return entity;
    }

    static getElementNames<T extends Function, K extends keyof T>(ctor: T): K[] | undefined {
        const meta = this.get(ctor);
        return meta && [...meta.elementKeys] as K[];
    }

    static getDataColumnNames<T extends Function, K extends keyof T>(ctor: T): K[] | undefined {
        const meta = this.get(ctor);
        if (meta)
            return meta.getDataColumnNames() as (K[]);
    }

    static getInsertColumnNames<T extends Function, K extends keyof T>(ctor: T): K[] | undefined {
        const meta = this.get(ctor);
        if (meta)
            return meta.getInsertColumnNames() as (K[]);
    }

    static getUpdateColumnNames<T extends Function, K extends keyof T>(ctor: T): K[] | undefined {
        const meta = this.get(ctor);
        if (meta)
            return meta.getUpdateColumnNames() as (K[]);
    }

}
