import {DataType, Eq} from '@sqb/builder';
import {
    IndexOptions,
    ConstructorThunk, ForeignKeyOptions, RelationColumnOptions, ColumnOptions,
} from '../types';
import {Maybe, Type} from '../../types';
import {ENTITY_DEFINITION_KEY} from '../consts';
import {IndexMeta} from './index-meta';
import {ForeignKeyMeta} from './foreign-key-meta';
import {ColumnElementMeta} from './column-element-meta';
import {EmbeddedElementMeta} from './embedded-element-meta';
import {RelationElementMeta} from './relation-element-meta';
import {serializeColumn} from '../util/serialize-element';
import {FindCommand} from '../commands/find.command';
import {Repository} from '../repository';
import {EntityChainRing} from './entity-chain-ring';
import {isColumnElement, isEmbeddedElement, isRelationElement} from '../helpers';

export type ColumnMeta = ColumnElementMeta | EmbeddedElementMeta | RelationElementMeta;

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

    constructor(readonly ctor: Type) {
        this.name = ctor.name;
    }

    getElement(name: string): Maybe<ColumnMeta> {
        if (!name)
            return;
        return this.elements.get(name.toLowerCase());
    }

    getColumnElement(name: string): Maybe<ColumnElementMeta> {
        if (!name)
            return;
        const col = this.elements.get(name.toLowerCase());
        return isColumnElement(col) ? col : undefined;
    }

    getColumnElementByFieldName(fieldName: string): Maybe<ColumnElementMeta> {
        if (!fieldName)
            return;
        fieldName = fieldName.toLowerCase();
        for (const el of this.elements.values()) {
            if (isColumnElement(el) && el.fieldName.toLowerCase() === fieldName)
                return el;
        }
    }

    getRelationElement(name: string): Maybe<RelationElementMeta> {
        if (!name)
            return;
        const col = this.elements.get(name.toLowerCase());
        return isRelationElement(col) ? col : undefined;
    }

    getEmbeddedElement(name: string): Maybe<EmbeddedElementMeta> {
        if (!name)
            return;
        const col = this.elements.get(name.toLowerCase());
        return isEmbeddedElement(col) ? col : undefined;
    }

    defineColumnElement(name: string, options?: ColumnOptions): ColumnElementMeta {
        let col = this.getElement(name);
        if (!col || !isColumnElement(col)) {
            col = new ColumnElementMeta(this, name, options);
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

    defineRelationElement(name: string, type: ConstructorThunk | EntityChainRing,
                          options?: RelationColumnOptions): RelationElementMeta {
        const chain = type instanceof EntityChainRing ? type :
            new EntityChainRing('', this.ctor, type);
        let l: EntityChainRing | undefined = chain;
        let i = 1;
        while (l) {
            chain.name = this.name + '.' + name + '(#' + (i++) + ')';
            l = l.next;
        }
        const col = new RelationElementMeta(this, name, chain, options);
        if (!this.elements.has(name.toLowerCase()))
            this.elementKeys.push(name);
        this.elements.set(name.toLowerCase(), col);

        if (options?.lazy) {
            // Set lazy resolver function to prototype
            const desc = Object.getOwnPropertyDescriptor(this.ctor.prototype, name);
            if (desc)
                delete this.ctor.prototype[name];
            const lastLink = col.chain.getLast();
            let keyCol: ColumnElementMeta;
            let targetCol: ColumnElementMeta;
            let targetEntity: EntityMeta;
            this.ctor.prototype[name] = async function (opts?: Repository.FindAllOptions) {
                keyCol = keyCol || await lastLink.resolveSourceColumn();
                if (this[keyCol.name] == null)
                    return;
                targetEntity = targetEntity || await lastLink.resolveTarget();
                targetCol = await lastLink.resolveTargetColumn();

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

    defineEmbeddedElement(propertyKey: string, type?: ConstructorThunk): EmbeddedElementMeta {
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

    getPrimaryIndexColumns(): ColumnElementMeta[] {
        const out: ColumnElementMeta[] = [];
        if (this.primaryIndex) {
            for (const k of this.primaryIndex.columns) {
                const col = this.getColumnElement(k);
                if (!col)
                    throw new Error(`Data column "${k}" in primary index of ${this.name} does not exists`)
                out.push(col);
            }
        }
        return out;
    }

    getColumnElementNames(): string[] {
        const out: string[] = [];
        for (const k of this.elementKeys) {
            const col = this.getElement(k);
            if (isColumnElement(col))
                out.push(k);
        }
        return out;
    }

    getInsertColumnNames(): string[] {
        const out: string[] = [];
        for (const k of this.elementKeys) {
            const col = this.getElement(k);
            if (isColumnElement(col) && !col.noInsert)
                out.push(k);
        }
        return out;
    }

    getUpdateColumnNames(): string[] {
        const out: string[] = [];
        for (const k of this.elementKeys) {
            const col = this.getElement(k);
            if (isColumnElement(col) && !col.noUpdate)
                out.push(k);
        }
        return out;
    }

    static get(ctor: Function): EntityMeta {
        return ctor.hasOwnProperty(ENTITY_DEFINITION_KEY) &&
            ctor[ENTITY_DEFINITION_KEY];
    }

    static attachTo(ctor: Type) {
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

    static getColumnNames<T extends Function, K extends keyof T>(ctor: T): K[] | undefined {
        const meta = this.get(ctor);
        if (meta)
            return meta.getColumnElementNames() as (K[]);
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
