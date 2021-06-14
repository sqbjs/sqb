import {DataType} from '@sqb/builder';
import {
    IndexOptions,
    TypeThunk, DataPropertyOptions,
} from '../orm.type';
import {Maybe, Type} from '../../types';
import {ENTITY_DEFINITION_KEY} from '../orm.const';
import {IndexMeta} from './index-meta';
import {Association} from './association';
import {EntityDataProperty} from './entity-data-property';
import {EntityObjectProperty} from './entity-object-property';
import {EntityAssociationProperty} from './entity-association-property';
import {serializeColumn} from '../util/serialize-element';
import {AssociationNode} from './association-node';
import {isDataProperty, isObjectProperty, isAssociationElement} from '../orm.helper';

export type EntityProperty = EntityDataProperty | EntityObjectProperty | EntityAssociationProperty;

export class EntityModel {
    private _propertyKeys: string[] = []; // cache
    readonly name: string;
    tableName?: string;
    schema?: string;
    comment?: string;
    primaryIndex?: IndexMeta;
    properties = new Map<string, EntityProperty>();
    indexes: IndexMeta[] = [];
    foreignKeys: Association[] = [];
    eventListeners: { event: string, fn: Function }[] = [];

    constructor(readonly ctor: Type) {
        this.name = ctor.name;
    }

    get propertyKeys(): string[] {
        if (!this._propertyKeys)
            this._propertyKeys = Array.from(this.properties.keys());
        return this._propertyKeys;
    }

    getProperty(name: string): Maybe<EntityProperty> {
        if (!name)
            return;
        return this.properties.get(name.toLowerCase());
    }

    getDataProperty(name: string): Maybe<EntityDataProperty> {
        if (!name)
            return;
        const prop = this.properties.get(name.toLowerCase());
        return isDataProperty(prop) ? prop : undefined;
    }

    getDataPropertyByFieldName(fieldName: string): Maybe<EntityDataProperty> {
        if (!fieldName)
            return;
        fieldName = fieldName.toLowerCase();
        for (const prop of this.properties.values()) {
            if (isDataProperty(prop) && prop.fieldName.toLowerCase() === fieldName)
                return prop;
        }
    }

    getObjectProperty(name: string): Maybe<EntityObjectProperty> {
        if (!name)
            return;
        const col = this.properties.get(name.toLowerCase());
        return isObjectProperty(col) ? col : undefined;
    }

    getAssociationProperty(name: string): Maybe<EntityAssociationProperty> {
        if (!name)
            return;
        const col = this.properties.get(name.toLowerCase());
        return isAssociationElement(col) ? col : undefined;
    }

    defineDataProperty(propertyKey: string, options?: DataPropertyOptions): EntityDataProperty {
        let prop = this.getProperty(propertyKey);
        if (!prop || !isDataProperty(prop)) {
            prop = new EntityDataProperty(this, propertyKey, options);
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

            if (!this.properties.has(propertyKey.toLowerCase()))
                this.propertyKeys.push(propertyKey);
            this.properties.set(propertyKey.toLowerCase(), prop);
        } else if (options)
            prop.assign(options);
        return prop;
    }

    defineAssociationProperty(propertyKey: string, association: AssociationNode): EntityAssociationProperty {
        const prop = new EntityAssociationProperty(this, propertyKey, association);
        let l: AssociationNode | undefined = association;
        let i = 1;
        while (l) {
            l.name = this.name + '.' + propertyKey + '#' + (i++) + ')';
            l = l.next;
        }
        if (!this.properties.has(propertyKey.toLowerCase()))
            this.propertyKeys.push(propertyKey);
        this.properties.set(propertyKey.toLowerCase(), prop);
        return prop;
    }

    defineObjectProperty(propertyKey: string, type?: TypeThunk): EntityObjectProperty {
        type = type || Reflect.getMetadata("design:type", this.ctor.prototype, propertyKey);
        if (typeof type !== 'function')
            throw new Error('"type" must be defined');
        let prop = this.getProperty(propertyKey);
        if (!prop || !isObjectProperty(prop)) {
            prop = new EntityObjectProperty(this, propertyKey, type);
            if (!this.properties.has(propertyKey.toLowerCase()))
                this.propertyKeys.push(propertyKey);
            this.properties.set(propertyKey.toLowerCase(), prop);
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

    getPrimaryIndexColumns(): EntityDataProperty[] {
        const out: EntityDataProperty[] = [];
        if (this.primaryIndex) {
            for (const k of this.primaryIndex.columns) {
                const col = this.getDataProperty(k);
                if (!col)
                    throw new Error(`Data column "${k}" in primary index of ${this.name} does not exists`)
                out.push(col);
            }
        }
        return out;
    }

    getElementNames(fn: (el: EntityProperty) => boolean): string[] {
        const out: string[] = [];
        for (const k of this.propertyKeys) {
            const el = this.getProperty(k);
            if (el && (!fn || fn(el)))
                out.push(k);
        }
        return out;
    }

    getColumnElementNames(): string[] {
        return this.getElementNames(isDataProperty);
    }

    getEmbeddedElementNames(): string[] {
        return this.getElementNames(isObjectProperty);
    }

    getAssociationElementNames(): string[] {
        return this.getElementNames(isAssociationElement);
    }

    getInsertColumnNames(): string[] {
        const out: string[] = [];
        for (const k of this.propertyKeys) {
            const col = this.getProperty(k);
            if (isDataProperty(col) && !col.noInsert)
                out.push(k);
        }
        return out;
    }

    getUpdateColumnNames(): string[] {
        const out: string[] = [];
        for (const k of this.propertyKeys) {
            const col = this.getProperty(k);
            if (isDataProperty(col) && !col.noUpdate)
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

    static get(ctor: Function): EntityModel {
        return ctor.hasOwnProperty(ENTITY_DEFINITION_KEY) &&
            ctor[ENTITY_DEFINITION_KEY];
    }

    static attachTo(ctor: Function) {
        let entity: EntityModel = this.get(ctor);
        if (entity)
            return entity;
        ctor[ENTITY_DEFINITION_KEY] = entity = new EntityModel(ctor as Type);
        // Merge base entity columns into this one
        const baseCtor = Object.getPrototypeOf(ctor);
        const base = EntityModel.get(baseCtor);
        if (base) {
            for (const k of base.propertyKeys) {
                const col = base.properties.get(k.toLowerCase());
                if (col) {
                    entity.propertyKeys.push(k);
                    entity.properties.set(k.toLowerCase(), col);
                }
            }
        }
        if (base.primaryIndex)
            entity.setPrimaryIndex([...base.primaryIndex.columns]);

        ctor.prototype.toJSON = function (): Object {
            const obj = {};
            const elementKeys = entity.propertyKeys;
            const l = elementKeys.length;
            let key;
            let v;
            for (let i = 0; i < l; i++) {
                key = elementKeys[i]
                v = this[key];
                if (v === undefined)
                    continue;
                const col = entity.getProperty(key);
                if (col)
                    obj[key] = serializeColumn(col, v);
            }
            return obj;
        }
        return entity;
    }

    static getElementNames<T extends Function, K extends keyof T>(ctor: T): K[] | undefined {
        const meta = this.get(ctor);
        return meta && [...meta.propertyKeys] as K[];
    }

    static getColumnNames<T extends Function, K extends keyof T>(ctor: T): K[] | undefined {
        const meta = this.get(ctor);
        if (meta)
            return meta.getColumnElementNames() as (K[]);
    }

    static getAssociationElementNames<T extends Function, K extends keyof T>(ctor: T): K[] | undefined {
        const meta = this.get(ctor);
        if (meta)
            return meta.getAssociationElementNames() as (K[]);
    }

    static getEmbeddedElementNames<T extends Function, K extends keyof T>(ctor: T): K[] | undefined {
        const meta = this.get(ctor);
        if (meta)
            return meta.getEmbeddedElementNames() as (K[]);
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
