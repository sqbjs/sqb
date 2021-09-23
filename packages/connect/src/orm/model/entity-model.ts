import {DataType} from '@sqb/builder';
import {
    IndexOptions,
    TypeThunk, DataPropertyOptions,
} from '../orm.type';
import {Maybe, Type} from '../../types';
import {ENTITY_DEFINITION_KEY} from '../orm.const';
import {IndexMeta} from './index-meta';
import {Association} from './association';
import {EntityColumnElement} from './entity-column-element';
import {EntityObjectElement} from './entity-object-element';
import {EntityAssociationElement} from './entity-association-element';
import {serializeColumn} from '../util/serialize-element';
import {AssociationNode} from './association-node';
import {isColumnElement, isObjectElement, isAssociationElement} from '../util/orm.helper';

export type EntityElement = EntityColumnElement | EntityObjectElement | EntityAssociationElement;

export class EntityModel {
    private _elementKeys?: string[]; // cache
    readonly name: string;
    tableName?: string;
    schema?: string;
    comment?: string;
    primaryIndex?: IndexMeta;
    elements = new Map<string, EntityElement>();
    indexes: IndexMeta[] = [];
    foreignKeys: Association[] = [];
    eventListeners: { event: string, fn: Function }[] = [];

    constructor(readonly ctor: Type) {
        this.name = ctor.name;
    }

    get elementKeys(): string[] {
        if (!(this._elementKeys && this.hasOwnProperty('_elementKeys')))
            this._elementKeys = Array.from(this.elements.keys());
        return this._elementKeys;
    }

    getElement(name: string): Maybe<EntityElement> {
        if (!name)
            return;
        return this.elements.get(name.toLowerCase());
    }

    getColumnElement(name: string): Maybe<EntityColumnElement> {
        if (!name)
            return;
        const prop = this.elements.get(name.toLowerCase());
        return isColumnElement(prop) ? prop : undefined;
    }

    getColumnElementByFieldName(fieldName: string): Maybe<EntityColumnElement> {
        if (!fieldName)
            return;
        fieldName = fieldName.toLowerCase();
        for (const prop of this.elements.values()) {
            if (isColumnElement(prop) && prop.fieldName.toLowerCase() === fieldName)
                return prop;
        }
    }

    getObjectElement(name: string): Maybe<EntityObjectElement> {
        if (!name)
            return;
        const col = this.elements.get(name.toLowerCase());
        return isObjectElement(col) ? col : undefined;
    }

    getAssociationElement(name: string): Maybe<EntityAssociationElement> {
        if (!name)
            return;
        const col = this.elements.get(name.toLowerCase());
        return isAssociationElement(col) ? col : undefined;
    }

    defineColumnElement(propertyKey: string, options?: DataPropertyOptions): EntityColumnElement {
        let prop = this.getElement(propertyKey);
        if (!prop || !isColumnElement(prop)) {
            prop = new EntityColumnElement(this, propertyKey, options);
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

            if (!this.elements.has(propertyKey.toLowerCase()))
                this.elementKeys.push(propertyKey);
            this.elements.set(propertyKey.toLowerCase(), prop);
        } else if (options)
            prop.assign(options);
        return prop;
    }

    defineAssociationElement(propertyKey: string, association: AssociationNode): EntityAssociationElement {
        const prop = new EntityAssociationElement(this, propertyKey, association);
        let l: AssociationNode | undefined = association;
        let i = 1;
        while (l) {
            l.name = this.name + '.' + propertyKey + '#' + (i++);
            l = l.next;
        }
        if (!this.elements.has(propertyKey.toLowerCase()))
            this.elementKeys.push(propertyKey);
        this.elements.set(propertyKey.toLowerCase(), prop);
        return prop;
    }

    defineObjectElement(propertyKey: string, type?: TypeThunk): EntityObjectElement {
        type = type || Reflect.getMetadata("design:type", this.ctor.prototype, propertyKey);
        if (typeof type !== 'function')
            throw new Error('"type" must be defined');
        let prop = this.getElement(propertyKey);
        if (!prop || !isObjectElement(prop)) {
            prop = new EntityObjectElement(this, propertyKey, type);
            if (!this.elements.has(propertyKey.toLowerCase()))
                this.elementKeys.push(propertyKey);
            this.elements.set(propertyKey.toLowerCase(), prop);
        }

        return prop;
    }

    setPrimaryIndex(column: string | string[], options?: IndexOptions): void {
        this.primaryIndex = new IndexMeta(this, column, options);
        this.primaryIndex.unique = true;
    }

    addIndex(column: string | string[], options?: IndexOptions): void {
        this.indexes.push(new IndexMeta(this, column, options));
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

    getPrimaryIndexColumns(): EntityColumnElement[] {
        const out: EntityColumnElement[] = [];
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

    getElementNames(fn: (el: EntityElement) => boolean): string[] {
        const out: string[] = [];
        for (const k of this.elementKeys) {
            const el = this.getElement(k);
            if (el && (!fn || fn(el)))
                out.push(k);
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

    async getForeignKeyFor(t: EntityModel): Promise<Maybe<Association>> {
        for (const f of this.foreignKeys) {
            if (await f.resolveTarget() === t)
                return f;
        }
    }

    static get(ctor: Function): Maybe<EntityModel> {
        return ctor[ENTITY_DEFINITION_KEY];
    }

    static hasOwn(ctor: Function): boolean {
        return ctor.hasOwnProperty(ENTITY_DEFINITION_KEY);
    }

    static attachTo(ctor: Function): EntityModel {
        const own: EntityModel | undefined = this.hasOwn(ctor) ? this.get(ctor) : undefined;
        if (own)
            return own;
        const current = this.get(ctor);
        const entity = new EntityModel(ctor as Type);
        Object.defineProperty(ctor, ENTITY_DEFINITION_KEY, {
            value: entity,
            enumerable: false
        })
        // Merge base entity columns into this one
        if (current) {
            entity.tableName = current.tableName;
            for (const k of current.elementKeys) {
                const col = current.elements.get(k.toLowerCase());
                if (col) {
                    entity.elementKeys.push(k);
                    entity.elements.set(k.toLowerCase(), col);
                }
            }
            for (const fk of current.foreignKeys) {
                const newFk = new Association(fk.name, {...fk, source: ctor as Type});
                entity.foreignKeys.push(newFk);
            }
            for (const idx of current.indexes) {
                const newIdx = new IndexMeta(entity, idx.columns, idx);
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
            return meta.getColumnNames() as (K[]);
    }

    static getAssociationElementNames<T extends Function, K extends keyof T>(ctor: T): K[] | undefined {
        const meta = this.get(ctor);
        if (meta)
            return meta.getAssociationElementNames() as (K[]);
    }

    static getNonAssociationElementNames<T extends Function, K extends keyof T>(ctor: T): K[] | undefined {
        const meta = this.get(ctor);
        if (meta)
            return meta.getNonAssociationElementNames() as (K[]);
    }

    static getObjectElementNames<T extends Function, K extends keyof T>(ctor: T): K[] | undefined {
        const meta = this.get(ctor);
        if (meta)
            return meta.getObjectElementNames() as (K[]);
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
