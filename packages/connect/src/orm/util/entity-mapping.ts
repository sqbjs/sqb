import {Type} from '../../types';
import {EntityModel} from '../model/entity-model';
import {Association} from '../model/association';
import {IndexMeta} from '../model/index-meta';

export function UnionEntity<A, B>(
    classARef: Type<A>,
    classBRef: Type<B>
): Type<A & B> {
    class UnionEntityClass {
        constructor(...args: any[]) {
            inheritPropertyInitializers(this, classARef, args);
            inheritPropertyInitializers(this, classBRef, args);
        }
    }

    const aModel = EntityModel.get(classARef);
    const bModel = EntityModel.get(classBRef);

    const entity = EntityModel.attachTo(UnionEntityClass);
    for (const fk of [...aModel.foreignKeys, ...bModel.foreignKeys]) {
        const newFk = new Association(fk.name, {...fk, source: UnionEntityClass});
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

    return UnionEntityClass as Type<A & B>;
}

export function PickEntity<T, K extends keyof T>(
    classRef: Type<T>,
    keys: readonly K[]
): Type<Pick<T, typeof keys[number]>> {
    class PickEntityClass {
        constructor(...args: any[]) {
            inheritPropertyInitializers(this, classRef, args);
        }
    }

    const srcModel = EntityModel.get(classRef);

    const entity = EntityModel.attachTo(PickEntityClass);
    const pickKeys = (keys as unknown as string[]);
    for (const fk of srcModel.foreignKeys) {
        if (fk.sourceKey && pickKeys.includes(fk.sourceKey)) {
            const newFk = new Association(fk.name, {...fk, source: PickEntityClass});
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

    return PickEntityClass as Type<Pick<T, typeof keys[number]>>;
}

export function OmitEntity<T, K extends keyof T>(
    classRef: Type<T>,
    keys: readonly K[]
): Type<Pick<T, typeof keys[number]>> {
    class PickEntityClass {
        constructor(...args: any[]) {
            inheritPropertyInitializers(this, classRef, args);
        }
    }

    const srcModel = EntityModel.get(classRef);

    const entity = EntityModel.attachTo(PickEntityClass);
    const omitKeys = (keys as unknown as string[]);
    for (const fk of srcModel.foreignKeys) {
        if (!(fk.sourceKey && omitKeys.includes(fk.sourceKey))) {
            const newFk = new Association(fk.name, {...fk, source: PickEntityClass});
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

    return PickEntityClass as Type<Pick<T, typeof keys[number]>>;
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
