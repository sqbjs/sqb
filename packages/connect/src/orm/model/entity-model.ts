import {Maybe, Type} from 'ts-gems';
import {DataType} from '@sqb/builder';
import {AssociationElementMetadata} from '../interfaces/association-element-metadata';
import {ColumnElementMetadata} from '../interfaces/column-element-metadata';
import {ComplexElementMetadata} from '../interfaces/complex-element-metadata';
import {IndexMetadata} from '../interfaces/index-metadata';
import {ENTITY_METADATA_KEY} from '../orm.const';
import {
    Ctor,
    DataPropertyOptions,
    TypeThunk,
} from '../orm.type';
import {isAssociationElement, isColumnElement, isComplexElement} from '../util/orm.helper';
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
    indexes: IndexMetadata[] = [];
    foreignKeys: Association[] = [];
    eventListeners: Record<string, Function[]> = {};

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

    defineColumnElement(propertyKey: string, options?: DataPropertyOptions): ColumnElementMetadata {
        let prop = EntityMetadata.getElement(this, propertyKey);
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
        let prop = EntityMetadata.getElement(this, propertyKey);
        if (!prop || !isComplexElement(prop)) {
            prop = ComplexElementMetadata.create(this, propertyKey, type);
        }
        this._defineElement(propertyKey, prop);
        // EntityMetadata.defineElement(this.ctor, propertyKey, prop);
        return prop;
    }

    protected _defineElement(propertyKey: string, meta: AnyElementMetadata) {
        this._elements[propertyKey.toLowerCase()] = meta;
        this._elementsByName[propertyKey] = meta;
    }

}

export namespace EntityMetadata {

    export function attachTo(ctor: Ctor): EntityModel {
        const own = getOwn(ctor);
        if (own)
            return own;
        const baseMeta = get(ctor);
        const meta = new EntityModel(ctor as Type);
        Reflect.defineMetadata(ENTITY_METADATA_KEY, meta, ctor);
        // Merge base entity columns into this one
        if (baseMeta) {
            EntityMetadata.mixin(meta, baseMeta);
        }

        ctor.prototype.toJSON = function (): Object {
            const obj = {};
            const elementKeys = meta.elementKeys;
            const l = elementKeys.length;
            let key;
            let v;
            for (let i = 0; i < l; i++) {
                key = elementKeys[i]
                v = this[key];
                if (v === undefined)
                    continue;
                const col = EntityMetadata.getElement(meta, key);
                if (col)
                    obj[col.name] = serializeColumn(col, v);
            }
            return obj;
        }
        return meta;
    }

    export function get(ctor: Ctor): Maybe<EntityModel> {
        return Reflect.getMetadata(ENTITY_METADATA_KEY, ctor);
    }

    export function getOwn(ctor: Ctor): Maybe<EntityModel> {
        return Reflect.getOwnMetadata(ENTITY_METADATA_KEY, ctor);
    }

    export function addIndex(model: EntityModel, index: IndexMetadata): void {
        model.indexes = model.indexes || [];
        index = {
            ...index,
            columns: Array.isArray(index.columns) ? index.columns : [index.columns]
        };
        if (index.primary)
            model.indexes.forEach(idx => delete idx.primary);
        model.indexes.push(index);
    }

    export function addForeignKey(model: EntityModel, propertyKey: string, target: TypeThunk, targetKey?: string): void {
        model.foreignKeys = model.foreignKeys || [];
        const fk = new Association(model.name + '.' + propertyKey, {
                source: model.ctor,
                sourceKey: propertyKey,
                target,
                targetKey
            }
        );
        model.foreignKeys.push(fk);
    }

    export function addEventListener(model: EntityModel, event: string, fn: Function): void {
        if (typeof fn !== 'function')
            throw new Error('Property must be a function');
        model.eventListeners = model.eventListeners || {};
        model.eventListeners[event] = model.eventListeners[event] || [];
        model.eventListeners[event].push(fn);
    }

    export function getElement(model: EntityModel, elementName: string): Maybe<AnyElementMetadata> {
        if (!elementName)
            return;
        return model.elements[elementName.toLowerCase()];
    }

    export function getColumnElement(model: EntityModel, elementName: string): Maybe<ColumnElementMetadata> {
        const el = getElement(model, elementName);
        return isColumnElement(el) ? el : undefined;
    }

    export function getObjectElement(model: EntityModel, elementName: string): Maybe<ComplexElementMetadata> {
        const el = getElement(model, elementName);
        return isComplexElement(el) ? el : undefined;
    }

    export function getAssociationElement(model: EntityModel, elementName: string): Maybe<AssociationElementMetadata> {
        const el = getElement(model, elementName);
        return isAssociationElement(el) ? el : undefined;
    }

    export function getColumnElementByFieldName(model: EntityModel, fieldName: string): Maybe<ColumnElementMetadata> {
        if (!fieldName)
            return;
        fieldName = fieldName.toLowerCase();
        for (const prop of Object.values(model.elements)) {
            if (isColumnElement(prop) && prop.fieldName.toLowerCase() === fieldName)
                return prop;
        }
    }

    export function getElementNames(model: EntityModel, filter?: (el: AnyElementMetadata) => boolean): string[] {
        const out: string[] = [];
        for (const el of Object.values(model.elements)) {
            if (el && (!filter || filter(el)))
                out.push(el.name);
        }
        return out;
    }

    export function getColumnNames(model: EntityModel): string[] {
        return getElementNames(model, isColumnElement);
    }

    export function getObjectElementNames(model: EntityModel): string[] {
        return getElementNames(model, isComplexElement);
    }

    export function getAssociationElementNames(model: EntityModel): string[] {
        return getElementNames(model, isAssociationElement);
    }

    export function getNonAssociationElementNames(model: EntityModel): string[] {
        return getElementNames(model, x => !isAssociationElement(x));
    }

    export function getInsertColumnNames(model: EntityModel): string[] {
        return getElementNames(model, x => isColumnElement(x) && !x.noInsert);
    }

    export function getUpdateColumnNames(model: EntityModel): string[] {
        return getElementNames(model, x => isColumnElement(x) && !x.noUpdate);
    }

    export function getPrimaryIndex(model: EntityModel): Maybe<IndexMetadata> {
        return model.indexes.find(idx => idx.primary);
    }

    export function getPrimaryIndexColumns(model: EntityModel): ColumnElementMetadata[] {
        const idx = getPrimaryIndex(model);
        const out: ColumnElementMetadata[] = [];
        if (idx) {
            for (const k of idx.columns) {
                const col = getColumnElement(model, k);
                if (!col)
                    throw new Error(`Data column "${k}" in primary index of ${model.name} does not exists`)
                out.push(col);
            }
        }
        return out;
    }

    export async function getForeignKeyFor(src: EntityModel, trg: EntityModel): Promise<Maybe<Association>> {
        for (const f of src.foreignKeys) {
            if (await f.resolveTarget() === trg)
                return f;
        }
    }

    export function setPrimaryKeys(
        model: EntityModel,
        column: string | string[],
        options?: Omit<IndexMetadata, 'columns' | 'unique' | 'primary'>
    ): void {
        addIndex(model, {
            ...options,
            columns: Array.isArray(column) ? column : [column],
            unique: true,
            primary: true
        });
    }

    export function mixin(derived: EntityModel, base: EntityModel, elements?: string[]) {
        const elementKeys = elements && elements.map(x => x.toLowerCase());
        const hasElement = (k: string) => !(elementKeys && !elementKeys.includes(k.toLowerCase()));
        // applyMixins(derived, baseCtor, hasElement);

        if (!derived.tableName) {
            derived.tableName = base.tableName;
            derived.schema = base.schema;
            derived.comment = base.comment;
        }
        // Copy indexes
        if (base.indexes && base.indexes.length) {
            const hasPrimaryIndex = !!getPrimaryIndex(derived);
            for (const idx of base.indexes) {
                if (!idx.columns.find(x => !hasElement(x))) {
                    if (hasPrimaryIndex)
                        addIndex(derived, {...idx, primary: undefined});
                    else
                        addIndex(derived, idx);
                }
            }
        }

        // Copy foreign indexes
        if (base.foreignKeys && base.foreignKeys.length) {
            derived.foreignKeys = derived.foreignKeys || [];
            for (const fk of base.foreignKeys) {
                if (!fk.sourceKey || hasElement(fk.sourceKey)) {
                    const newFk = new Association(fk.name, {...fk, source: derived.ctor});
                    derived.foreignKeys.push(newFk);
                }
            }
        }

        // Copy event listeners
        if (base.eventListeners) {
            for (const [event, arr] of Object.entries(base.eventListeners)) {
                arr.forEach(fn =>
                    EntityMetadata.addEventListener(derived, event, fn))
            }
        }

        // Copy elements
        for (const [n, p] of Object.entries(base.elements)) {
            if (!hasElement(n))
                continue;
            const o: any = Object.assign({}, p);
            o.entity = derived;
            Object.setPrototypeOf(o, Object.getPrototypeOf(p));
            derived.elements[n] = o;
        }
    }
}
