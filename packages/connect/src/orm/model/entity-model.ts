import {Maybe, Type} from 'ts-gems';
import {DataType} from '@sqb/builder';
import {AssociationElementMetadata} from '../interfaces/association-element-metadata';
import {ColumnElementMetadata} from '../interfaces/column-element-metadata';
import {EmbeddedElementMetadata} from '../interfaces/embedded-element-metadata';
import {IndexMetadata} from '../interfaces/index-metadata';
import {ENTITY_METADATA_KEY} from '../orm.const';
import {
    Ctor,
    DataPropertyOptions,
    TypeThunk,
} from '../orm.type';
import {isAssociationElement, isColumnElement, isEmbeddedElement} from '../util/orm.helper';
import {serializeColumn} from '../util/serialize-element';
import {Association} from './association';
import {AssociationNode} from './association-node';

export type AnyElementMetadata = ColumnElementMetadata | EmbeddedElementMetadata | AssociationElementMetadata;

export class EntityModel {
    private _elementKeys?: string[]; // cache
    elements: Record<string, AnyElementMetadata> = {};
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

    get elementKeys(): string[] {
        // return Object.keys(this._elementsByName);
        if (!Object.prototype.hasOwnProperty.call(this, '_elementKeys'))
            this._elementKeys = Object.values(this.elements).map(m => m.name);
        return this._elementKeys as string[];
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

    export function getElement(entity: EntityModel, elementName: string): Maybe<AnyElementMetadata> {
        if (!elementName)
            return;
        return entity.elements[elementName.toLowerCase()];
    }

    export function getColumnElement(entity: EntityModel, elementName: string): Maybe<ColumnElementMetadata> {
        const el = getElement(entity, elementName);
        return isColumnElement(el) ? el : undefined;
    }

    export function getEmbeddedElement(entity: EntityModel, elementName: string): Maybe<EmbeddedElementMetadata> {
        const el = getElement(entity, elementName);
        return isEmbeddedElement(el) ? el : undefined;
    }

    export function getAssociationElement(entity: EntityModel, elementName: string): Maybe<AssociationElementMetadata> {
        const el = getElement(entity, elementName);
        return isAssociationElement(el) ? el : undefined;
    }

    export function getColumnElementByFieldName(entity: EntityModel, fieldName: string): Maybe<ColumnElementMetadata> {
        if (!fieldName)
            return;
        fieldName = fieldName.toLowerCase();
        for (const prop of Object.values(entity.elements)) {
            if (isColumnElement(prop) && prop.fieldName.toLowerCase() === fieldName)
                return prop;
        }
    }

    export function getElementNames(entity: EntityModel, filter?: (el: AnyElementMetadata) => boolean): string[] {
        const out: string[] = [];
        for (const el of Object.values(entity.elements)) {
            if (el && (!filter || filter(el)))
                out.push(el.name);
        }
        return out;
    }

    export function getColumnNames(entity: EntityModel): string[] {
        return getElementNames(entity, isColumnElement);
    }

    export function getEmbeddedElementNames(entity: EntityModel): string[] {
        return getElementNames(entity, isEmbeddedElement);
    }

    export function getAssociationElementNames(entity: EntityModel): string[] {
        return getElementNames(entity, isAssociationElement);
    }

    export function getNonAssociationElementNames(entity: EntityModel): string[] {
        return getElementNames(entity, x => !isAssociationElement(x));
    }

    export function getInsertColumnNames(entity: EntityModel): string[] {
        return getElementNames(entity, x => isColumnElement(x) && !x.noInsert);
    }

    export function getUpdateColumnNames(entity: EntityModel): string[] {
        return getElementNames(entity, x => isColumnElement(x) && !x.noUpdate);
    }

    export function getPrimaryIndex(entity: EntityModel): Maybe<IndexMetadata> {
        return entity.indexes.find(idx => idx.primary);
    }

    export function getPrimaryIndexColumns(entity: EntityModel): ColumnElementMetadata[] {
        const idx = getPrimaryIndex(entity);
        const out: ColumnElementMetadata[] = [];
        if (idx) {
            for (const k of idx.columns) {
                const col = getColumnElement(entity, k);
                if (!col)
                    throw new Error(`Data column "${k}" in primary index of ${entity.name} does not exists`)
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

    export function addIndex(entity: EntityModel, index: IndexMetadata): void {
        entity.indexes = entity.indexes || [];
        index = {
            ...index,
            columns: Array.isArray(index.columns) ? index.columns : [index.columns]
        };
        if (index.primary)
            entity.indexes.forEach(idx => delete idx.primary);
        entity.indexes.push(index);
    }

    export function addForeignKey(entity: EntityModel, propertyKey: string, target: TypeThunk, targetKey?: string): void {
        entity.foreignKeys = entity.foreignKeys || [];
        const fk = new Association(entity.name + '.' + propertyKey, {
                source: entity.ctor,
                sourceKey: propertyKey,
                target,
                targetKey
            }
        );
        entity.foreignKeys.push(fk);
    }

    export function addEventListener(entity: EntityModel, event: string, fn: Function): void {
        if (typeof fn !== 'function')
            throw new Error('Property must be a function');
        entity.eventListeners = entity.eventListeners || {};
        entity.eventListeners[event] = entity.eventListeners[event] || [];
        entity.eventListeners[event].push(fn);
    }

    export function defineColumnElement(
        entity: EntityModel,
        propertyKey: string,
        options?: DataPropertyOptions
    ): ColumnElementMetadata {
        let prop = EntityMetadata.getElement(entity, propertyKey);

        if (!prop || !isColumnElement(prop)) {
            prop = ColumnElementMetadata.create(entity, propertyKey, options);
            if (!prop.type) {
                const typ = Reflect.getMetadata("design:type", entity.ctor.prototype, propertyKey); // todo
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
            entity.elements[propertyKey.toLowerCase()] = prop;
        } else if (options)
            ColumnElementMetadata.assign(prop, options);

        return prop;
    }

    export function defineEmbeddedElement(
        entity: EntityModel,
        propertyKey: string,
        type: TypeThunk
    ): EmbeddedElementMetadata {
        const prop = EmbeddedElementMetadata.create(entity, propertyKey, type);
        entity.elements[propertyKey.toLowerCase()] = prop;
        return prop;
    }

    export function defineAssociationElement(
        entity: EntityModel,
        propertyKey: string,
        association: AssociationNode
    ): AssociationElementMetadata {
        const prop = AssociationElementMetadata.create(entity, propertyKey, association);
        let l: AssociationNode | undefined = association;
        let i = 1;
        while (l) {
            l.name = entity.name + '.' + propertyKey + '#' + (i++);
            l = l.next;
        }
        entity.elements[propertyKey.toLowerCase()] = prop;
        return prop;
    }

    export function setPrimaryKeys(
        entity: EntityModel,
        column: string | string[],
        options?: Omit<IndexMetadata, 'columns' | 'unique' | 'primary'>
    ): void {
        addIndex(entity, {
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
