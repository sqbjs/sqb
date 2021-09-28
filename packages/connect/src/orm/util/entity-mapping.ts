import {Type} from 'ts-gems';
import {EntityModel} from '../model/entity-model';
import {Association} from '../model/association';
import {IndexMeta} from '../model/index-meta';

export function mixinEntities<A, B, C, D, E, F>(
    derived: Type, classARef: Type<A>, classBRef: Type<B>, classCRef: Type<C>,
    classDRef: Type<D>, classERef: Type<E>, classFRef: Type<F>): Type<A & B & C & D & E & F>
export function mixinEntities<A, B, C, D, E>(
    derived: Type, classARef: Type<A>, classBRef: Type<B>, classCRef: Type<C>,
    classDRef: Type<D>, classERef: Type<E>): Type<A & B & C & D & E>
export function mixinEntities<A, B, C, D>(
    derived: Type, classARef: Type<A>, classBRef: Type<B>, classCRef: Type<C>,
    classDRef: Type<D>): Type<A & B & C & D>
export function mixinEntities<A, B, C>(derived: Type, classARef: Type<A>, classBRef: Type<B>, classCRef: Type<C>): Type<A & B & C>
export function mixinEntities<A, B>(derived: Type, classARef: Type<A>, classBRef: Type<B>): Type<A & B>
export function mixinEntities<A, B>(derived: Type, classARef: Type<A>, classBRef: Type<B>): Type<A & B>
export function mixinEntities(derived: Type, classARef: Type, classBRef?: Type, classCRef?: Type,
                              classDRef?: Type, classERef?: Type, classFRef?: Type) {
    const trg = EntityModel.attachTo(derived);
    for (const classRef of [classARef, classBRef, classCRef, classDRef, classERef, classFRef]) {
        if (!classRef)
            continue;
        const src = EntityModel.get(classRef);
        if (!src)
            return derived;
        trg.tableName = src.tableName;
        if (!trg.primaryIndex && src.primaryIndex) {
            trg.primaryIndex = new IndexMeta(trg, src.primaryIndex.columns, src.primaryIndex);
        }
        if (src.foreignKeys) {
            trg.foreignKeys = trg.foreignKeys || [];
            for (const fk of src.foreignKeys) {
                const newFk = new Association(fk.name, {...fk, source: derived});
                trg.foreignKeys.push(newFk);
            }
        }
        if (src.indexes) {
            trg.indexes = trg.indexes || [];
            for (const idx of src.indexes) {
                const newIdx = new IndexMeta(trg, idx.columns, idx);
                trg.indexes.push(newIdx);
            }
        }
        if (src.eventListeners) {
            trg.eventListeners = trg.eventListeners || [];
            trg.eventListeners.push(...src.eventListeners);
        }
        src.elements.forEach((p, n) => {
            const o: any = Object.assign({}, p);
            o.entity = trg;
            Object.setPrototypeOf(o, Object.getPrototypeOf(p));
            trg.elements.set(n, o);
        });
    }
    return derived;
}

export function pickEntityInto<T, K extends keyof T>(
    derived: Type, classRef: Type<T>, keys: readonly K[]): Type<Pick<T, typeof keys[number]>> {
    const trg = EntityModel.attachTo(derived);
    const src = EntityModel.get(classRef);
    if (!src)
        return derived;
    trg.tableName = src.tableName;
    trg.schema = src.schema;
    trg.comment = src.comment;
    trg.primaryIndex = src.primaryIndex;
    const pickKeys = (keys as unknown as string[]).map(x => x.toLowerCase());
    for (const fk of src.foreignKeys) {
        if (fk.sourceKey && pickKeys.includes(fk.sourceKey.toLowerCase())) {
            const newFk = new Association(fk.name, {...fk, source: derived});
            trg.foreignKeys.push(newFk);
        }
    }
    for (const idx of src.indexes) {
        if (!idx.columns.find(x => !pickKeys.includes(x.toLowerCase()))) {
            const newIdx = new IndexMeta(trg, idx.columns, idx);
            trg.indexes.push(newIdx);
        }
    }
    trg.eventListeners.push(...src.eventListeners);
    src.elements.forEach((p, n) => {
        if (pickKeys.includes(n))
            trg.elements.set(n, p)
    });

    return derived;
}

export function omitEntityInto<T, K extends keyof T>(
    derived: Type,
    classRef: Type<T>, keys: readonly K[]
): Type<Omit<T, typeof keys[number]>> {

    const trg = EntityModel.attachTo(derived);
    const src = EntityModel.get(classRef);
    if (!src)
        return derived;
    trg.tableName = src.tableName;
    trg.schema = src.schema;
    trg.comment = src.comment;
    trg.primaryIndex = src.primaryIndex;
    const omitKeys = (keys as unknown as string[]).map(x => x.toLowerCase());
    for (const fk of src.foreignKeys) {
        if (!(fk.sourceKey && omitKeys.includes(fk.sourceKey.toLowerCase()))) {
            const newFk = new Association(fk.name, {...fk, source: derived});
            trg.foreignKeys.push(newFk);
        }
    }
    for (const idx of src.indexes) {
        if (!idx.columns.find(x => omitKeys.includes(x.toLowerCase()))) {
            const newIdx = new IndexMeta(trg, idx.columns, idx);
            trg.indexes.push(newIdx);
        }
    }
    trg.eventListeners.push(...src.eventListeners);
    src.elements.forEach((p, n) => {
        if (!omitKeys.includes(n.toLowerCase()))
            trg.elements.set(n.toLowerCase(), p)
    });
    trg.elements.forEach((p, n) => {
        if (omitKeys.includes(n.toLowerCase()))
            trg.elements.delete(n.toLowerCase())
    });
    return derived;
}

export function UnionEntity<A, B>(classARef: Type<A>, classBRef: Type<B>): Type<A & B> {
    class UnionEntityClass {
        constructor(...args: any[]) {
            inheritPropertyInitializers(this, classARef, args);
            inheritPropertyInitializers(this, classBRef, args);
        }
    }

    return mixinEntities(UnionEntityClass, classARef, classBRef);
}

export function PickEntity<T, K extends keyof T>(classRef: Type<T>, keys: readonly K[]): Type<Pick<T, typeof keys[number]>> {
    class PickEntityClass {
        constructor(...args: any[]) {
            inheritPropertyInitializers(this, classRef, args);
        }
    }

    return pickEntityInto(PickEntityClass, classRef, keys);
}

export function OmitEntity<T, K extends keyof T>(
    classRef: Type<T>, keys: readonly K[]): Type<Omit<T, typeof keys[number]>> {

    class OmitEntityClass {
        constructor(...args: any[]) {
            inheritPropertyInitializers(this, classRef, args);
        }
    }

    return omitEntityInto(OmitEntityClass, classRef, keys);
}

function inheritPropertyInitializers(
    target: Record<string, any>,
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
