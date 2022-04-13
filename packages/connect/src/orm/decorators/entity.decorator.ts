import {Maybe, Type} from 'ts-gems';
import {AssociationElementMetadata} from '../interfaces/association-element-metadata';
import {ColumnElementMetadata} from '../interfaces/column-element-metadata';
import {ComplexElementMetadata} from '../interfaces/complex-element-metadata';
import {IndexMetadata} from '../interfaces/index-metadata';
import {AnyElementMetadata, EntityMetadata} from '../model/entity-model';
import {Ctor, EntityConfig} from '../orm.type';
import {applyMixins} from '../util/apply-mixins';

export function Entity(options?: EntityConfig | string): ClassDecorator {
    return function (target) {
        const opts: EntityConfig = typeof options === 'object' ? options : {};
        const tableName = typeof options === 'string' ? options : opts.tableName;
        const entity = EntityMetadata.attachTo(target);
        entity.tableName = tableName || target.name;
        if (opts.schema)
            entity.schema = opts.schema;
        if (opts.comment)
            entity.comment = opts.comment;
    };
}

export namespace Entity {

    export const getMetadata = EntityMetadata.get;
    export const getOwnMetadata = EntityMetadata.getOwn;

    export function getElement(ctor: Ctor, elementName: string): Maybe<AnyElementMetadata> {
        const model = EntityMetadata.get(ctor);
        return model && EntityMetadata.getElement(model, elementName);
    }

    export function getColumnElement(ctor: Ctor, elementName: string): Maybe<ColumnElementMetadata> {
        const model = EntityMetadata.get(ctor);
        return model && EntityMetadata.getColumnElement(model, elementName);
    }

    export function getObjectElement(ctor: Ctor, elementName: string): Maybe<ComplexElementMetadata> {
        const model = EntityMetadata.get(ctor);
        return model && EntityMetadata.getObjectElement(model, elementName);
    }

    export function getAssociationElement(ctor: Ctor, elementName: string): Maybe<AssociationElementMetadata> {
        const model = EntityMetadata.get(ctor);
        return model && EntityMetadata.getAssociationElement(model, elementName);
    }

    export function getColumnElementByFieldName(ctor: Ctor, fieldName: string): Maybe<ColumnElementMetadata> {
        const model = EntityMetadata.get(ctor);
        return model && EntityMetadata.getColumnElementByFieldName(model, fieldName);
    }

    export function getElementNames(ctor: Ctor, filter?: (el: AnyElementMetadata) => boolean): string[] {
        const model = EntityMetadata.get(ctor);
        return (model && EntityMetadata.getElementNames(model, filter)) || [];
    }

    export function getColumnNames(ctor: Ctor): string[] {
        const model = EntityMetadata.get(ctor);
        return (model && EntityMetadata.getColumnNames(model)) || [];
    }

    export function getObjectElementNames(ctor: Ctor): string[] {
        const model = EntityMetadata.get(ctor);
        return (model && EntityMetadata.getObjectElementNames(model)) || [];
    }

    export function getAssociationElementNames(ctor: Ctor): string[] {
        const model = EntityMetadata.get(ctor);
        return (model && EntityMetadata.getAssociationElementNames(model)) || [];
    }

    export function getNonAssociationElementNames(ctor: Ctor): string[] {
        const model = EntityMetadata.get(ctor);
        return (model && EntityMetadata.getNonAssociationElementNames(model)) || [];
    }

    export function getInsertColumnNames(ctor: Ctor): string[] {
        const model = EntityMetadata.get(ctor);
        return (model && EntityMetadata.getInsertColumnNames(model)) || [];
    }

    export function getUpdateColumnNames(ctor: Ctor): string[] {
        const model = EntityMetadata.get(ctor);
        return (model && EntityMetadata.getUpdateColumnNames(model)) || [];
    }

    export function getPrimaryIndex(ctor: Ctor): Maybe<IndexMetadata> {
        const model = EntityMetadata.attachTo(ctor);
        return EntityMetadata.getPrimaryIndex(model);
    }

    export function getPrimaryIndexColumns(ctor: Ctor): ColumnElementMetadata[] {
        const model = EntityMetadata.attachTo(ctor);
        return EntityMetadata.getPrimaryIndexColumns(model);
    }

    export function Pick<T, K extends keyof T>(
        classRef: Type<T>,
        keys: readonly K[]
    ): Type<Pick<T, typeof keys[number]>> {
        const PickEntityClass = class {
            constructor(...args: any[]) {
                applyConstructorProperties(this, classRef, args);
            }
        }
        const pickKeys = keys as unknown as string[];
        applyMixins(PickEntityClass, classRef,
            (k: string) => pickKeys.includes(k.toLowerCase()));
        const srcMeta = EntityMetadata.get(classRef);
        if (srcMeta) {
            const trgMeta = EntityMetadata.attachTo(PickEntityClass);
            EntityMetadata.mixin(trgMeta, srcMeta, pickKeys);
        }
        return PickEntityClass as Type<Pick<T, typeof keys[number]>>;
    }

    export function Omit<T, K extends keyof T>(
        classRef: Type<T>,
        keys: readonly K[]
    ): Type<Omit<T, typeof keys[number]>> {
        const OmitEntityClass = class {
            constructor(...args: any[]) {
                applyConstructorProperties(this, classRef, args);
            }
        }
        const omitKeys = keys as unknown as string[];
        applyMixins(OmitEntityClass, classRef,
            (k: string) => !(omitKeys && !omitKeys.includes(k.toLowerCase())));
        const srcMeta = EntityMetadata.get(classRef);
        if (srcMeta) {
            const elementKeys = srcMeta.elementKeys.filter(x => !keys.includes(x as any));
            const trgMeta = EntityMetadata.attachTo(OmitEntityClass);
            EntityMetadata.mixin(trgMeta, srcMeta, elementKeys);
        }
        return OmitEntityClass as Type<Omit<T, typeof keys[number]>>;
    }

    export function Union<A, B>(baseA: Type<A>, baseB: Type<B>): Type<A & B>
    export function Union<A, B, C>(baseA: Type<A>, baseB: Type<B>, baseC: Type<C>): Type<A & B & C>
    export function Union<A, B, C, D>(
        baseA: Type<A>, baseB: Type<B>, baseC: Type<C>, baseD: Type<D>
    ): Type<A & B & C & D>
    export function Union<A, B, C, D, E>(
        baseA: Type<A>, baseB: Type<B>, baseC: Type<C>,
        baseD: Type<D>, baseE: Type<E>
    ): Type<A & B & C & D & E>
    export function Union<A, B, C, D, E, F>(
        baseA: Type<A>, baseB: Type<B>, baseC: Type<C>,
        baseD: Type<D>, baseE: Type<E>, baseF: Type<F>
    ): Type<A & B & C & D & E & F>
    export function Union(...bases: Type[]) {
        const UnionClass = class {
            constructor(...args: any[]) {
                for (const c of bases)
                    applyConstructorProperties(this, c, args);
            }
        }
        for (const base of bases) {
            applyMixins(UnionClass, base);
            const srcMeta = EntityMetadata.get(base);
            if (srcMeta) {
                const trgMeta = EntityMetadata.attachTo(UnionClass);
                EntityMetadata.mixin(trgMeta, srcMeta);
            }
        }
        return UnionClass;
    }
}

function applyConstructorProperties(
    target: any,
    sourceClass: Type,
    constructorArgs: any[],
    isPropertyInherited?: (key: string) => boolean,
) {
    try {
        const tempInstance = new sourceClass(...constructorArgs);
        const keys = Object.getOwnPropertyNames(tempInstance);
        for (const key of keys) {
            const srcDesc = Object.getOwnPropertyDescriptor(tempInstance, key);
            const trgDesc = Object.getOwnPropertyDescriptor(target, key);
            if (!srcDesc || trgDesc || (isPropertyInherited && !isPropertyInherited(key)))
                continue;
            Object.defineProperty(target, key, srcDesc);
        }
    } catch {
        //
    }
}
