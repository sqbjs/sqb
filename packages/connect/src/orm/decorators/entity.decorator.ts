import {Type} from 'ts-gems';
import {EntityMetadata} from '../model/entity-model';
import {EntityConfig} from '../orm.type';

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
    export const getElementNames = EntityMetadata.getElementNames;
    export const getColumnNames = EntityMetadata.getColumnNames;
    export const getAssociationElementNames = EntityMetadata.getAssociationElementNames;
    export const getNonAssociationElementNames = EntityMetadata.getNonAssociationElementNames;
    export const getInsertColumnNames = EntityMetadata.getInsertColumnNames;
    export const getUpdateColumnNames = EntityMetadata.getUpdateColumnNames;
    export const getObjectElementNames = EntityMetadata.getObjectElementNames;


    export function Pick<T, K extends keyof T>(
        classRef: Type<T>,
        keys: readonly K[]
    ): Type<Pick<T, typeof keys[number]>> {
        const PickEntityClass = class {
            constructor(...args: any[]) {
                applyConstructorProperties(this, classRef, args);
            }
        }
        EntityMetadata.mixin(PickEntityClass, classRef, keys as unknown as string[]);
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
        const meta = EntityMetadata.get(classRef);
        const omitKeys = meta && meta.elementKeys.filter(x => !keys.includes(x as any));
        EntityMetadata.mixin(OmitEntityClass, classRef, omitKeys as unknown as string[]);
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
            EntityMetadata.mixin(UnionClass, base);
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
