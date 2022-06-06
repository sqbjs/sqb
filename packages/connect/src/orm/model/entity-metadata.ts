import {Maybe, Type} from 'ts-gems';
import {DataType} from '@sqb/builder';
import {ENTITY_METADATA_KEY} from '../orm.const';
import {Ctor, TypeThunk} from '../orm.type';
import {isAssociationElement, isColumnElement, isEmbeddedElement} from '../util/orm.helper';
import {serializeColumn} from '../util/serialize-element';
import {Association} from './association';
import {AssociationElementMetadata} from './association-element-metadata';
import {AssociationNode} from './association-node';
import {ColumnElementMetadata, ColumnElementOptions} from './column-element-metadata';
import {EmbeddedElementMetadata, EmbeddedElementOptions} from './embedded-element-metadata';
import {IndexMetadata} from './index-metadata';

export type AnyElementMetadata = ColumnElementMetadata | EmbeddedElementMetadata | AssociationElementMetadata;
export type EntityOptions = Partial<Pick<EntityMetadata, 'name' | 'schema' | 'comment' | 'tableName'>>;

export interface EntityMetadata {
    readonly ctor: Type;
    readonly name: string;
    tableName?: string;
    schema?: string;
    comment?: string;
    elements: Record<string, AnyElementMetadata>;
    indexes: IndexMetadata[];
    foreignKeys: Association[];
    eventListeners: Record<string, Function[]>;
}

export namespace EntityMetadata {

    export function define(ctor: Ctor): EntityMetadata {
        const own = getOwn(ctor);
        if (own)
            return own;
        const baseMeta = get(ctor);
        const meta: EntityMetadata = {
            ctor: ctor as Type,
            name: ctor.name,
            elements: {},
            indexes: [],
            foreignKeys: [],
            eventListeners: {}
        };
        Reflect.defineMetadata(ENTITY_METADATA_KEY, meta, ctor);
        // Merge base entity columns into this one
        if (baseMeta) {
            EntityMetadata.mixin(meta, baseMeta);
        }

        ctor.prototype.toJSON = function (): Object {
            const obj = {};
            const elementKeys = Object.keys(meta.elements);
            const l = elementKeys.length;
            let key;
            let v;
            for (let i = 0; i < l; i++) {
                key = elementKeys[i];
                const col = EntityMetadata.getElement(meta, key);
                if (col) {
                    v = this[col.name];
                    if (v !== undefined)
                        obj[col.name] = serializeColumn(col, v);
                }
            }
            return obj;
        }
        return meta;
    }

    export function get(ctor: Ctor): Maybe<EntityMetadata> {
        return Reflect.getMetadata(ENTITY_METADATA_KEY, ctor);
    }

    export function getOwn(ctor: Ctor): Maybe<EntityMetadata> {
        return Reflect.getOwnMetadata(ENTITY_METADATA_KEY, ctor);
    }

    export function getElement(entity: EntityMetadata, elementName: string): Maybe<AnyElementMetadata> {
        return elementName ? entity.elements[elementName.toLowerCase()] : undefined;
    }

    export function getColumnElement(entity: EntityMetadata, elementName: string): Maybe<ColumnElementMetadata> {
        const el = getElement(entity, elementName);
        if (el && !isColumnElement(el))
            throw new Error(`"${el.name}" requested as "column" but it is "${el.kind}"`);
        return el as ColumnElementMetadata;
    }

    export function getEmbeddedElement(entity: EntityMetadata, elementName: string): Maybe<EmbeddedElementMetadata> {
        const el = getElement(entity, elementName);
        if (el && !isEmbeddedElement(el))
            throw new Error(`"${el.name}" requested as "embedded" but it is "${el.kind}"`);
        return el as EmbeddedElementMetadata;
    }

    export function getAssociationElement(entity: EntityMetadata, elementName: string): Maybe<AssociationElementMetadata> {
        const el = getElement(entity, elementName);
        if (el && !isAssociationElement(el))
            throw new Error(`"${el.name}" requested as "association" but it is "${el.kind}"`);
        return el as AssociationElementMetadata;
    }

    export function findElement(entity: EntityMetadata, predicate: (el: AnyElementMetadata) => boolean): Maybe<AnyElementMetadata> {
        return Object.values(entity.elements).find(predicate);
    }

    export function getColumnElementByFieldName(entity: EntityMetadata, fieldName: string): Maybe<ColumnElementMetadata> {
        if (!fieldName)
            return;
        fieldName = fieldName.toLowerCase();
        for (const prop of Object.values(entity.elements)) {
            if (isColumnElement(prop) && prop.fieldName.toLowerCase() === fieldName)
                return prop;
        }
    }

    export function getElementNames(entity: EntityMetadata, filter?: (el: AnyElementMetadata) => boolean): string[] {
        if (filter) {
            const out: string[] = [];
            for (const el of Object.values(entity.elements)) {
                if (el && (!filter || filter(el)))
                    out.push(el.name);
            }
            return out;
        }
        // Create a cached name array
        if (!Object.prototype.hasOwnProperty.call(entity, '_elementNames'))
            Object.defineProperty(entity, '_elementNames', {
                enumerable: false,
                configurable: true,
                writable: true,
                value: Object.values(entity.elements).map(m => m.name)
            });
        return (entity as any)._elementNames as string[];
    }

    export function getColumnNames(entity: EntityMetadata): string[] {
        return getElementNames(entity, isColumnElement);
    }

    export function getEmbeddedElementNames(entity: EntityMetadata): string[] {
        return getElementNames(entity, isEmbeddedElement);
    }

    export function getAssociationElementNames(entity: EntityMetadata): string[] {
        return getElementNames(entity, isAssociationElement);
    }

    export function getNonAssociationElementNames(entity: EntityMetadata): string[] {
        return getElementNames(entity, x => !isAssociationElement(x));
    }

    export function getInsertColumnNames(entity: EntityMetadata): string[] {
        return getElementNames(entity, x => isColumnElement(x) && !x.noInsert);
    }

    export function getUpdateColumnNames(entity: EntityMetadata): string[] {
        return getElementNames(entity, x => isColumnElement(x) && !x.noUpdate);
    }

    export function getPrimaryIndex(entity: EntityMetadata): Maybe<IndexMetadata> {
        return entity.indexes && entity.indexes.find(idx => idx.primary);
    }

    export function getPrimaryIndexColumns(entity: EntityMetadata): ColumnElementMetadata[] {
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

    export async function getForeignKeyFor(src: EntityMetadata, trg: EntityMetadata): Promise<Maybe<Association>> {
        if (!src.foreignKeys)
            return;
        for (const f of src.foreignKeys) {
            if (await f.resolveTarget() === trg)
                return f;
        }
    }

    export function addIndex(entity: EntityMetadata, index: IndexMetadata): void {
        entity.indexes = entity.indexes || [];
        index = {
            ...index,
            columns: Array.isArray(index.columns) ? index.columns : [index.columns]
        };
        if (index.primary)
            entity.indexes.forEach(idx => delete idx.primary);
        entity.indexes.push(index);
    }

    export function addForeignKey(entity: EntityMetadata, propertyKey: string, target: TypeThunk, targetKey?: string): void {
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

    export function addEventListener(entity: EntityMetadata, event: string, fn: Function): void {
        if (typeof fn !== 'function')
            throw new Error('Property must be a function');
        entity.eventListeners = entity.eventListeners || {};
        entity.eventListeners[event] = entity.eventListeners[event] || [];
        entity.eventListeners[event].push(fn);
    }

    export function defineColumnElement(
        entity: EntityMetadata,
        name: string,
        options: ColumnElementOptions = {}
    ): ColumnElementMetadata {
        delete (entity as any)._elementNames;
        let prop = EntityMetadata.getElement(entity, name);
        if (isColumnElement(prop))
            options = {...prop, ...options};

        if (!options.type) {
            switch (options.dataType) {
                case DataType.BOOL:
                    options.type = Boolean;
                    break;
                case DataType.VARCHAR:
                case DataType.CHAR:
                case DataType.TEXT:
                    options.type = String;
                    break;
                case DataType.NUMBER:
                case DataType.DOUBLE:
                case DataType.FLOAT:
                case DataType.INTEGER:
                case DataType.SMALLINT:
                    options.type = Number;
                    break;
                case DataType.TIMESTAMP:
                case DataType.TIMESTAMPTZ:
                    options.type = Date;
                    break;
                case DataType.BINARY:
                    options.type = Buffer;
                    break;
                default:
                    options.type = String;
            }
        }
        if (!options.dataType) {
            switch (options.type) {
                case Boolean:
                    options.dataType = DataType.BOOL;
                    break;
                case Number:
                    options.dataType = DataType.NUMBER;
                    break;
                case Date:
                    options.dataType = DataType.TIMESTAMP;
                    break;
                case Array:
                    options.dataType = DataType.VARCHAR;
                    options.isArray = true;
                    break;
                case Buffer:
                    options.dataType = DataType.BINARY;
                    break;
                default:
                    options.dataType = DataType.VARCHAR;
            }
        }

        prop = ColumnElementMetadata.create(entity, name, options);
        entity.elements[name.toLowerCase()] = prop;
        return prop;
    }

    export function defineEmbeddedElement(
        entity: EntityMetadata,
        name: string,
        type: TypeThunk,
        options?: EmbeddedElementOptions
    ): EmbeddedElementMetadata {
        delete (entity as any)._elementNames;
        let prop = EntityMetadata.getElement(entity, name);
        if (isEmbeddedElement(prop))
            options = {...prop, ...options};
        prop = EmbeddedElementMetadata.create(entity, name, type, options);
        entity.elements[name.toLowerCase()] = prop;
        return prop;
    }

    export function defineAssociationElement(
        entity: EntityMetadata,
        propertyKey: string,
        association: AssociationNode
    ): AssociationElementMetadata {
        delete (entity as any)._elementNames;
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
        entity: EntityMetadata,
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

    export function mixin(derived: EntityMetadata, base: EntityMetadata, filter?: (n: string) => boolean) {
        // const elementKeys = elements && elements.map(x => x.toLowerCase());
        const hasElement = (k: string) => !filter || filter(k);

        delete (derived as any)._elementNames;
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
        derived.elements = derived.elements || {};
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
