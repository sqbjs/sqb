import {Type} from '../../types';
import {EntityModel} from '../model/entity-model';
import {Association} from '../model/association';
import {IndexMeta} from '../model/index-meta';

export function mixinEntities<A, B>(derived: Type, classARef: Type<A>, classBRef: Type<B>): Type<A & B> {
    const aModel = EntityModel.get(classARef);
    const bModel = EntityModel.get(classBRef);

    const entity = EntityModel.attachTo(derived);
    for (const fk of [...aModel.foreignKeys, ...bModel.foreignKeys]) {
        const newFk = new Association(fk.name, {...fk, source: derived});
        entity.foreignKeys.push(newFk);
    }
    for (const idx of [...aModel.indexes, ...bModel.indexes]) {
        const newIdx = new IndexMeta(entity, idx.columns, idx);
        entity.indexes.push(newIdx);
    }
    entity.eventListeners.push(...aModel.eventListeners);
    entity.eventListeners.push(...bModel.eventListeners);
    aModel.properties.forEach((p, n) => entity.properties.set(n, p));
    bModel.properties.forEach((p, n) => entity.properties.set(n, p));
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
