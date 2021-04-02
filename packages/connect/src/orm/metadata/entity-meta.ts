import {isRelationElement, RelationElementMeta} from './relation-element-meta';
import {DataType, Eq} from '@sqb/builder';
import {
    IndexOptions,
    ConstructorThunk, ForeignKeyOptions, RelationColumnOptions, DataColumnOptions,
} from '../types';
import {Maybe, Type} from '../../types';
import {ENTITY_DEFINITION_KEY} from '../consts';
import {IndexMeta} from './index-meta';
import {ForeignKeyMeta} from './foreign-key-meta';
import {DataColumnMeta, isDataColumn} from './data-column-meta';
import {EmbeddedElementMeta, isEmbeddedElement} from './embedded-element-meta';
import {serializeColumn} from '../util/serialize-element';
import {FindCommand} from '../commands/find.command';
import {Repository} from '../repository';

export type ColumnMeta = DataColumnMeta | EmbeddedElementMeta | RelationElementMeta;

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

    getElement(name: string): Maybe<ColumnMeta> {
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

    getDataColumnByFieldName(fieldName: string): Maybe<DataColumnMeta> {
        if (!fieldName)
            return;
        fieldName = fieldName.toLowerCase();
        for (const el of this.elements.values()) {
            if (isDataColumn(el) && el.fieldName.toLowerCase() === fieldName)
                return el;
        }
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
        let col = this.getElement(name);
        if (!col || !isDataColumn(col)) {
            col = new DataColumnMeta(this, name, options);
            if (!col.type) {
                const typ = Reflect.getMetadata("design:type", this.ctor.prototype, name);
                if (typ === Array) {
                    col.type = String;
                    col.isArray = true;
                } else col.type = typ;
            }
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
        const col = new RelationElementMeta(this, name, target, options);
        if (!this.elements.has(name.toLowerCase()))
            this.elementKeys.push(name);
        this.elements.set(name.toLowerCase(), col);

        if (options?.lazy) {
            // Set lazy resolver function to prototype
            const desc = Object.getOwnPropertyDescriptor(this.ctor.prototype, name);
            if (desc)
                delete this.ctor.prototype[name];
            this.ctor.prototype[name] = async function (opts?: Repository.FindAllOptions) {
                const keyCol = await col.foreign.resolveKeyColumn();
                if (this[keyCol.name] == null)
                    return;
                const targetEntity = await col.foreign.resolveTarget();
                const targetCol = await col.foreign.resolveTargetColumn();

                const filter = Eq(targetCol.name, this[keyCol.name]);
                const connection = this[Symbol.for('connection')];
                const r = await FindCommand.execute({
                    connection,
                    ...opts,
                    entity: targetEntity,
                    filter: opts?.filter ? [filter, opts?.filter] : filter,
                });
                return col.hasMany ? r : r[0];
            }
        }

        return col;
    }

    setEmbeddedElement(propertyKey: string, type?: ConstructorThunk): EmbeddedElementMeta {
        type = type || Reflect.getMetadata("design:type", this.ctor.prototype, propertyKey);
        if (typeof type !== 'function')
            throw new Error('"type" must be defined');
        let col = this.getElement(propertyKey);
        if (!col || !isEmbeddedElement(col)) {
            col = new EmbeddedElementMeta(this, propertyKey, type);
            if (!this.elements.has(propertyKey.toLowerCase()))
                this.elementKeys.push(propertyKey);
            this.elements.set(propertyKey.toLowerCase(), col);
        }

        return col;
    }

    setPrimaryIndex(column: string | string[], options?: IndexOptions): void {
        this.primaryIndex = new IndexMeta(this, column, options);
        this.primaryIndex.unique = true;
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

    before(event: 'insert' | 'update' | 'destroy', fn: Type): void {
        this.eventListeners.push({event: 'before-' + event, fn});
    }

    after(event: 'insert' | 'update' | 'destroy', fn: Type): void {
        this.eventListeners.push({event: 'after-' + event, fn});
    }

    getPrimaryIndexColumns(): DataColumnMeta[] {
        const out: DataColumnMeta[] = [];
        if (this.primaryIndex) {
            for (const k of this.primaryIndex.columns) {
                const col = this.getDataColumn(k);
                if (!col)
                    throw new Error(`Data column "${k}" in primary index of ${this.name} does not exists`)
                out.push(col);
            }
        }
        return out;
    }

    getDataColumnNames(): string[] {
        const out: string[] = [];
        for (const k of this.elementKeys) {
            const col = this.getElement(k);
            if (isDataColumn(col))
                out.push(k);
        }
        return out;
    }

    getInsertColumnNames(): string[] {
        const out: string[] = [];
        for (const k of this.elementKeys) {
            const col = this.getElement(k);
            if (isDataColumn(col) && !col.noInsert)
                out.push(k);
        }
        return out;
    }

    getUpdateColumnNames(): string[] {
        const out: string[] = [];
        for (const k of this.elementKeys) {
            const col = this.getElement(k);
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
                const col = entity.getElement(key);
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
