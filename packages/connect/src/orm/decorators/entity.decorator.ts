import {Maybe, Type} from 'ts-gems';
import {AssociationElementMetadata} from '../model/association-element-metadata';
import {ColumnElementMetadata} from '../model/column-element-metadata';
import {EmbeddedElementMetadata} from '../model/embedded-element-metadata';
import {AnyElementMetadata, EntityMetadata, EntityOptions} from '../model/entity-metadata';
import {IndexMetadata} from '../model/index-metadata';
import {applyMixins} from '../util/apply-mixins';

export function Entity(options?: EntityOptions | string): ClassDecorator {
    return function (target) {
        const opts: EntityOptions = typeof options === 'object' ? options : {};
        const tableName = typeof options === 'string' ? options : opts.tableName;
        const entity = EntityMetadata.inject(target);
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

    export function getElement<T>(ctor: Type<T>, key: keyof T | string): Maybe<AnyElementMetadata> {
        const model = EntityMetadata.get(ctor);
        return model && EntityMetadata.getElement(model, key as string);
    }

    export function getColumnElement<T>(ctor: Type<T>, key: keyof T | string): Maybe<ColumnElementMetadata> {
        const model = EntityMetadata.get(ctor);
        return model && EntityMetadata.getColumnElement(model, key as string);
    }

    export function getEmbeddedElement<T>(ctor: Type<T>, key: keyof T | string): Maybe<EmbeddedElementMetadata> {
        const model = EntityMetadata.get(ctor);
        return model && EntityMetadata.getEmbeddedElement(model, key as string);
    }

    export function getAssociationElement<T>(ctor: Type<T>, key: keyof T | string): Maybe<AssociationElementMetadata> {
        const model = EntityMetadata.get(ctor);
        return model && EntityMetadata.getAssociationElement(model, key as string);
    }

    export function getColumnElementByFieldName(ctor: Type, fieldName: string): Maybe<ColumnElementMetadata> {
        const model = EntityMetadata.get(ctor);
        return model && EntityMetadata.getColumnElementByFieldName(model, fieldName);
    }

    export function find(ctor: Type, predicate: (el: AnyElementMetadata) => boolean): Maybe<AnyElementMetadata> {
        const model = EntityMetadata.get(ctor);
        return model && EntityMetadata.findElement(model, predicate);
    }

    export function getElementNames(ctor: Type, filter?: (el: AnyElementMetadata) => boolean): string[] {
        const model = EntityMetadata.get(ctor);
        return (model && EntityMetadata.getElementNames(model, filter)) || [];
    }

    export function getColumnNames(ctor: Type): string[] {
        const model = EntityMetadata.get(ctor);
        return (model && EntityMetadata.getColumnNames(model)) || [];
    }

    export function getEmbeddedElementNames(ctor: Type): string[] {
        const model = EntityMetadata.get(ctor);
        return (model && EntityMetadata.getEmbeddedElementNames(model)) || [];
    }

    export function getAssociationElementNames(ctor: Type): string[] {
        const model = EntityMetadata.get(ctor);
        return (model && EntityMetadata.getAssociationElementNames(model)) || [];
    }

    export function getNonAssociationElementNames(ctor: Type): string[] {
        const model = EntityMetadata.get(ctor);
        return (model && EntityMetadata.getNonAssociationElementNames(model)) || [];
    }

    export function getInsertColumnNames(ctor: Type): string[] {
        const model = EntityMetadata.get(ctor);
        return (model && EntityMetadata.getInsertColumnNames(model)) || [];
    }

    export function getUpdateColumnNames(ctor: Type): string[] {
        const model = EntityMetadata.get(ctor);
        return (model && EntityMetadata.getUpdateColumnNames(model)) || [];
    }

    export function getPrimaryIndex(ctor: Type): Maybe<IndexMetadata> {
        const model = EntityMetadata.inject(ctor);
        return EntityMetadata.getPrimaryIndex(model);
    }

    export function getPrimaryIndexColumns(ctor: Type): ColumnElementMetadata[] {
        const model = EntityMetadata.inject(ctor);
        return EntityMetadata.getPrimaryIndexColumns(model);
    }

    export function mixin<A, B>(derivedCtor: Type<A>, baseB: Type<B>): Type<A & B>
    export function mixin<A, B, C>(derivedCtor: Type<A>, baseB: Type<B>, baseC: Type<C>): Type<A & B & C>
    export function mixin<A, B, C, D>(
        derivedCtor: Type<A>, baseB: Type<B>, baseC: Type<C>, baseD: Type<D>
    ): Type<A & B & C & D>
    export function mixin<A, B, C, D, E>(
        derivedCtor: Type<A>, baseB: Type<B>, baseC: Type<C>,
        baseD: Type<D>, baseE: Type<E>
    ): Type<A & B & C & D & E>
    export function mixin<A, B, C, D, E, F>(
        derivedCtor: Type<A>, baseB: Type<B>, baseC: Type<C>,
        baseD: Type<D>, baseE: Type<E>, baseF: Type<F>
    ): Type<A & B & C & D & E & F>
    export function mixin(derivedCtor: any, ...bases: Type[]) {
        const trgMeta = EntityMetadata.inject(derivedCtor);
        for (const base of bases) {
            applyMixins(derivedCtor, base);
            const srcMeta = EntityMetadata.get(base);
            if (srcMeta) {
                EntityMetadata.mixin(trgMeta, srcMeta);
            }
        }
        return derivedCtor;
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
        const pickKeys = (keys as unknown as string[]).map(x => x.toLowerCase());
        const filter = (k) => pickKeys.includes(k.toLowerCase());
        applyMixins(PickEntityClass, classRef, filter);
        const srcMeta = EntityMetadata.get(classRef);
        if (srcMeta) {
            const trgMeta = EntityMetadata.inject(PickEntityClass);
            EntityMetadata.mixin(trgMeta, srcMeta, filter);
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
        const omitKeys = (keys as unknown as string[]).map(x => x.toLowerCase());
        const filter = (k) => !omitKeys.includes(k.toLowerCase());
        applyMixins(OmitEntityClass, classRef, filter);
        const srcMeta = EntityMetadata.get(classRef);
        if (srcMeta) {
            const trgMeta = EntityMetadata.inject(OmitEntityClass);
            EntityMetadata.mixin(trgMeta, srcMeta, filter);
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
        const trgMeta = EntityMetadata.inject(UnionClass);
        for (const base of bases) {
            applyMixins(UnionClass, base);
            const srcMeta = EntityMetadata.get(base);
            if (srcMeta) {
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
