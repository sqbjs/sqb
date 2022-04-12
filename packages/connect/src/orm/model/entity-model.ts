import {Maybe, Type} from 'ts-gems';
import {DataType} from '@sqb/builder';
import {AssociationElementMetadata} from '../interfaces/association-element-metadata';
import {ColumnElementMetadata} from '../interfaces/column-element-metadata';
import {ComplexElementMetadata} from '../interfaces/complex-element-metadata';
import {IndexMetadata} from '../interfaces/index-metadata';
import {ENTITY_METADATA_KEY} from '../orm.const';
import {
    DataPropertyOptions,
    IndexOptions,
    TypeThunk,
} from '../orm.type';
import {applyMixins} from '../util/apply-mixins';
import {isAssociationElement, isColumnElement, isObjectElement} from '../util/orm.helper';
import {serializeColumn} from '../util/serialize-element';
import {Association} from './association';
import {AssociationNode} from './association-node';

export type AnyElementMetadata = ColumnElementMetadata | ComplexElementMetadata | AssociationElementMetadata;

export class EntityModel {
    private _elementKeys?: string[]; // cache
    private _elements: Record<string, AnyElementMetadata> = {};
    private _elementsByName: Record<string, AnyElementMetadata> = {};
    readonly name: string;
    tableName?: string;
    schema?: string;
    comment?: string;
    primaryIndex?: IndexMetadata;
    indexes: IndexMetadata[] = [];
    foreignKeys: Association[] = [];
    eventListeners: { event: string, fn: Function }[] = [];

    constructor(readonly ctor: Type) {
        this.name = ctor.name;
    }

    get elements(): Record<string, AnyElementMetadata> {
        return this._elements;
    }

    get elementKeys(): string[] {
        // return Object.keys(this._elementsByName);
        if (!Object.prototype.hasOwnProperty.call(this, '_elementKeys'))
            this._elementKeys = Object.values(this.elements).map(m => m.name);
        return this._elementKeys as string[];
    }

    getElement(name: string): Maybe<AnyElementMetadata> {
        if (!name)
            return;
        return this.elements[name.toLowerCase()];
    }

    getColumnElement(name: string): Maybe<ColumnElementMetadata> {
        if (!name)
            return;
        const prop = this.elements[name.toLowerCase()];
        return isColumnElement(prop) ? prop : undefined;
    }

    getColumnElementByFieldName(fieldName: string): Maybe<ColumnElementMetadata> {
        if (!fieldName)
            return;
        fieldName = fieldName.toLowerCase();
        for (const prop of Object.values(this.elements)) {
            if (isColumnElement(prop) && prop.fieldName.toLowerCase() === fieldName)
                return prop;
        }
    }

    getObjectElement(name: string): Maybe<ComplexElementMetadata> {
        if (!name)
            return;
        const col = this.elements[name.toLowerCase()];
        return isObjectElement(col) ? col : undefined;
    }

    getAssociationElement(name: string): Maybe<AssociationElementMetadata> {
        if (!name)
            return;
        const col = this.elements[name.toLowerCase()];
        return isAssociationElement(col) ? col : undefined;
    }

    defineColumnElement(propertyKey: string, options?: DataPropertyOptions): ColumnElementMetadata {

        let prop = this.getElement(propertyKey);
        if (!prop || !isColumnElement(prop)) {
            prop = ColumnElementMetadata.create(this, propertyKey, options);
            if (!prop.type) {
                const typ = Reflect.getMetadata("design:type", this.ctor.prototype, propertyKey);
                if (typ === Array) {
                    prop.type = String;
                    prop.isArray = true;
                } else prop.type = typ;
            }
            if (!prop.dataType) {
                if (prop.type === Boolean)
                    prop.dataType = DataType.BOOL;
                else if (prop.type === String)
                    prop.dataType = DataType.VARCHAR;
                else if (prop.type === Number)
                    prop.dataType = DataType.NUMBER;
                else if (prop.type === Date)
                    prop.dataType = DataType.TIMESTAMP;
                else if (prop.type === Array) {
                    prop.dataType = DataType.VARCHAR;
                    prop.isArray = true;
                } else if (prop.type === Buffer)
                    prop.dataType = DataType.BINARY;
            }
            if (options?.isArray)
                prop.isArray = true;

            // if (!this.elements[elementKey])
//                 this.elementKeys.push(propertyKey);
            this._defineElement(propertyKey, prop);
        } else if (options)
            ColumnElementMetadata.assign(prop, options);

        // EntityMetadata.defineElement(this.ctor, propertyKey, prop);

        return prop;
    }

    defineAssociationElement(propertyKey: string, association: AssociationNode): AssociationElementMetadata {
        const prop = AssociationElementMetadata.create(this, propertyKey, association);
        let l: AssociationNode | undefined = association;
        let i = 1;
        while (l) {
            l.name = this.name + '.' + propertyKey + '#' + (i++);
            l = l.next;
        }
        // if (!this.elements[propertyKey.toLowerCase()])
        // this.elementKeys.push(propertyKey);
        this._defineElement(propertyKey, prop);
        // EntityMetadata.defineElement(this.ctor, propertyKey, prop);
        return prop;
    }

    defineObjectElement(propertyKey: string, type?: TypeThunk): ComplexElementMetadata {
        type = type || Reflect.getMetadata("design:type", this.ctor.prototype, propertyKey);
        if (typeof type !== 'function')
            throw new Error('"type" must be defined');
        let prop = this.getElement(propertyKey);
        if (!prop || !isObjectElement(prop)) {
            prop = ComplexElementMetadata.create(this, propertyKey, type);
            // if (!this.elements[propertyKey.toLowerCase()])
            // this.elementKeys.push(propertyKey);
        }
        this._defineElement(propertyKey, prop);
        // EntityMetadata.defineElement(this.ctor, propertyKey, prop);
        return prop;
    }

    setPrimaryIndex(column: string | string[], options?: IndexOptions): void {
        this.primaryIndex = IndexMetadata.create(this, column, options);
        this.primaryIndex.unique = true;
    }

    addIndex(column: string | string[], options?: IndexOptions): void {
        this.indexes.push(IndexMetadata.create(this, column, options));
    }

    addForeignKey(propertyKey: string, target: TypeThunk, targetKey?: string): void {
        const fk = new Association(this.name + '.' + propertyKey, {
                source: this.ctor,
                sourceKey: propertyKey,
                target,
                targetKey
            }
        );
        this.foreignKeys.push(fk);
    }

    before(event: 'insert' | 'update' | 'destroy', fn: Type): void {
        this.eventListeners.push({event: 'before-' + event, fn});
    }

    after(event: 'insert' | 'update' | 'destroy', fn: Type): void {
        this.eventListeners.push({event: 'after-' + event, fn});
    }

    getPrimaryIndexColumns(): ColumnElementMetadata[] {
        const out: ColumnElementMetadata[] = [];
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

    getElementNames(filter?: (el: AnyElementMetadata) => boolean): string[] {
        const out: string[] = [];
        for (const el of Object.values(this.elements)) {
            if (el && (!filter || filter(el)))
                out.push(el.name);
        }

        return out;
    }

    getColumnNames(): string[] {
        return this.getElementNames(isColumnElement);
    }

    getObjectElementNames(): string[] {
        return this.getElementNames(isObjectElement);
    }

    getAssociationElementNames(): string[] {
        return this.getElementNames(isAssociationElement);
    }

    getNonAssociationElementNames(): string[] {
        return this.getElementNames(x => !isAssociationElement(x));
    }

    getInsertColumnNames(): string[] {
        const out: string[] = [];
        for (const el of Object.values(this.elements)) {
            if (isColumnElement(el) && !el.noInsert)
                out.push(el.name);
        }
        return out;
    }

    getUpdateColumnNames(): string[] {
        const out: string[] = [];
        for (const el of Object.values(this.elements)) {
            if (isColumnElement(el) && !el.noUpdate)
                out.push(el.name);
        }
        return out;
    }

    protected _defineElement(propertyKey: string, meta: AnyElementMetadata) {
        this._elements[propertyKey.toLowerCase()] = meta;
        this._elementsByName[propertyKey] = meta;
    }

    async getForeignKeyFor(t: EntityModel): Promise<Maybe<Association>> {
        for (const f of this.foreignKeys) {
            if (await f.resolveTarget() === t)
                return f;
        }
    }

    static get(ctor: Function): Maybe<EntityModel> {
        return Reflect.getMetadata(ENTITY_METADATA_KEY, ctor);
    }

    static hasOwn(ctor: Function): boolean {
        return Reflect.hasOwnMetadata(ENTITY_METADATA_KEY, ctor);
    }

}

export namespace EntityMetadata {

    export function attachTo(ctor: Type | Function): EntityModel {
        const own = getOwn(ctor);
        if (own)
            return own;
        const current = get(ctor);
        const entity = new EntityModel(ctor as Type);
        Reflect.defineMetadata(ENTITY_METADATA_KEY, entity, ctor);
        // Merge base entity columns into this one
        if (current) {
            entity.tableName = current.tableName;
            for (const [k, el] of Object.entries(current.elements)) {
                entity.elements[k] = el;
            }
            for (const fk of current.foreignKeys) {
                const newFk = new Association(fk.name, {...fk, source: ctor as Type});
                entity.foreignKeys.push(newFk);
            }
            for (const idx of current.indexes) {
                const newIdx = IndexMetadata.create(entity, idx.columns, idx);
                entity.indexes.push(newIdx);
            }
            entity.eventListeners.push(...current.eventListeners);
            if (current.primaryIndex)
                entity.setPrimaryIndex([...current.primaryIndex.columns]);
        }

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
                    obj[col.name] = serializeColumn(col, v);
            }
            return obj;
        }
        return entity;
    }

    export function get(ctor: Type | Function): Maybe<EntityModel> {
        return Reflect.getMetadata(ENTITY_METADATA_KEY, ctor);
    }

    export function getOwn(ctor: Type | Function): Maybe<EntityModel> {
        return Reflect.getOwnMetadata(ENTITY_METADATA_KEY, ctor);
    }

    export function getElementNames<T extends Type | Function, K extends keyof T>(ctor: T): Maybe<K[]> {
        const meta = get(ctor);
        return meta && [...meta.elementKeys] as K[];
    }

    export function getColumnNames<T extends Type | Function, K extends keyof T>(ctor: T): Maybe<K[]> {
        const meta = get(ctor);
        if (meta)
            return meta.getColumnNames() as (K[]);
    }

    export function getAssociationElementNames<T extends Type | Function, K extends keyof T>(ctor: T): Maybe<K[]> {
        const meta = get(ctor);
        if (meta)
            return meta.getAssociationElementNames() as (K[]);
    }

    export function getNonAssociationElementNames<T extends Type | Function, K extends keyof T>(ctor: T): Maybe<K[]> {
        const meta = get(ctor);
        if (meta)
            return meta.getNonAssociationElementNames() as (K[]);
    }

    export function getObjectElementNames<T extends Type | Function, K extends keyof T>(ctor: T): Maybe<K[]> {
        const meta = get(ctor);
        if (meta)
            return meta.getObjectElementNames() as (K[]);
    }

    export function getInsertColumnNames<T extends Type | Function, K extends keyof T>(ctor: T): Maybe<K[]> {
        const meta = get(ctor);
        if (meta)
            return meta.getInsertColumnNames() as (K[]);
    }

    export function getUpdateColumnNames<T extends Type | Function, K extends keyof T>(ctor: T): Maybe<K[]> {
        const meta = get(ctor);
        if (meta)
            return meta.getUpdateColumnNames() as (K[]);
    }

    export function mixin<T, A>(derived: Type<T>, baseCtor: Type<A>, elements?: string[]): Type<T & A> {
        const elementKeys = elements && elements.map(x => x.toLowerCase());
        const hasElement = (k: string) => !(elementKeys && !elementKeys.includes(k.toLowerCase()));
        applyMixins(derived, baseCtor, hasElement);
        const trg = attachTo(derived);
        const src = get(baseCtor);
        if (!src)
            return derived as Type<T & A>;

        if (!trg.tableName) {
            trg.tableName = src.tableName;
            trg.schema = src.schema;
            trg.comment = src.comment;
        }

        // If target has no primary index and source has
        if (!trg.primaryIndex && src.primaryIndex) {
            // Ignore if index columns is not in elements array
            if (!src.primaryIndex.columns.find(x => !hasElement(x))) {
                trg.primaryIndex = {...src.primaryIndex, entity: trg};
            }
        }

        // Copy indexes
        if (src.indexes && src.indexes.length) {
            trg.indexes = trg.indexes || [];
            for (const idx of src.indexes) {
                if (!idx.columns.find(x => !hasElement(x))) {
                    trg.indexes.push({...idx, entity: trg});
                }
            }
        }

        // Copy foreign indexes
        if (src.foreignKeys && src.foreignKeys.length) {
            trg.foreignKeys = trg.foreignKeys || [];
            for (const fk of src.foreignKeys) {
                if (!fk.sourceKey || hasElement(fk.sourceKey)) {
                    const newFk = new Association(fk.name, {...fk, source: derived});
                    trg.foreignKeys.push(newFk);
                }
            }
        }

        // Copy event listeners
        if (src.eventListeners && src.eventListeners.length) {
            trg.eventListeners = trg.eventListeners || [];
            trg.eventListeners.push(...src.eventListeners);
        }

        // Copy elements
        for (const [n, p] of Object.entries(src.elements)) {
            if (!hasElement(n))
                continue;
            const o: any = Object.assign({}, p);
            o.entity = trg;
            Object.setPrototypeOf(o, Object.getPrototypeOf(p));
            trg.elements[n] = o;
        }
        return derived as Type<T & A>;
    }
}
