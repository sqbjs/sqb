import {Type} from '../../types';
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
    const entity = EntityModel.attachTo(derived);
    for (const classRef of [classARef, classBRef, classCRef, classDRef, classERef, classFRef]) {
        if (!classRef)
            continue;
        const model = EntityModel.get(classRef);
        if (!entity.primaryIndex && model.primaryIndex) {
            entity.primaryIndex = new IndexMeta(entity, model.primaryIndex.columns, model.primaryIndex);
        }
        for (const fk of model.foreignKeys) {
            const newFk = new Association(fk.name, {...fk, source: derived});
            entity.foreignKeys.push(newFk);
        }
        for (const idx of model.indexes) {
            const newIdx = new IndexMeta(entity, idx.columns, idx);
            entity.indexes.push(newIdx);
        }
        entity.eventListeners.push(...model.eventListeners);
        model.properties.forEach((p, n) => {
            const o: any = Object.assign({}, p);
            o.entity = entity;
            Object.setPrototypeOf(o, Object.getPrototypeOf(p));
            entity.properties.set(n, o);
        });
    }
    return derived;
}

export function pickCloneEntity<T, K extends keyof T>(
    derived: Type,
    classRef: Type<T>, keys: readonly K[]): Type<Pick<T, typeof keys[number]>> {

    const srcModel = EntityModel.get(classRef);

    const entity = EntityModel.attachTo(derived);
    const pickKeys = (keys as unknown as string[]);
    for (const fk of srcModel.foreignKeys) {
        if (fk.sourceKey && pickKeys.includes(fk.sourceKey)) {
            const newFk = new Association(fk.name, {...fk, source: derived});
            entity.foreignKeys.push(newFk);
        }
    }
    for (const idx of srcModel.indexes) {
        if (!idx.columns.find(x => !pickKeys.includes(x))) {
            const newIdx = new IndexMeta(entity, idx.columns, idx);
            entity.indexes.push(newIdx);
        }
    }
    entity.eventListeners.push(...srcModel.eventListeners);
    srcModel.properties.forEach((p, n) => {
        if (pickKeys.includes(n))
            entity.properties.set(n, p)
    });

    return derived as Type<Pick<T, typeof keys[number]>>;
}

export function omitCloneEntity<T, K extends keyof T>(
    derived: Type,
    classRef: Type<T>, keys: readonly K[]): Type<Omit<T, typeof keys[number]>> {

    const srcModel = EntityModel.get(classRef);

    const entity = EntityModel.attachTo(derived);
    const omitKeys = (keys as unknown as string[]);
    for (const fk of srcModel.foreignKeys) {
        if (!(fk.sourceKey && omitKeys.includes(fk.sourceKey))) {
            const newFk = new Association(fk.name, {...fk, source: derived});
            entity.foreignKeys.push(newFk);
        }
    }
    for (const idx of srcModel.indexes) {
        if (!idx.columns.find(x => omitKeys.includes(x))) {
            const newIdx = new IndexMeta(entity, idx.columns, idx);
            entity.indexes.push(newIdx);
        }
    }
    entity.eventListeners.push(...srcModel.eventListeners);
    srcModel.properties.forEach((p, n) => {
        if (!omitKeys.includes(n))
            entity.properties.set(n, p)
    });
    return derived as Type<Omit<T, typeof keys[number]>>;
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

    return pickCloneEntity(PickEntityClass, classRef, keys);
}

export function OmitEntity<T, K extends keyof T>(
    classRef: Type<T>, keys: readonly K[]): Type<Omit<T, typeof keys[number]>> {

    class OmitEntityClass {
        constructor(...args: any[]) {
            inheritPropertyInitializers(this, classRef, args);
        }
    }

    return omitCloneEntity(OmitEntityClass, classRef, keys);
}

function inheritPropertyInitializers(
    target: Record<string, any>,
    sourceClass: Type,
    constructorArgs: any[],
    isPropertyInherited?: (key: string) => boolean,
) {
    try {
        const tempInstance = new sourceClass(...constructorArgs);
        const propertyKeys = Object.getOwnPropertyNames(tempInstance);
        for (const propertyKey of propertyKeys) {
            const srcDesc = Object.getOwnPropertyDescriptor(tempInstance, propertyKey);
            const trgDesc = Object.getOwnPropertyDescriptor(target, propertyKey);
            if (!srcDesc || trgDesc || (isPropertyInherited && !isPropertyInherited(propertyKey)))
                continue;
            Object.defineProperty(target, propertyKey, srcDesc);
        }
    } catch {
        //
    }
}
