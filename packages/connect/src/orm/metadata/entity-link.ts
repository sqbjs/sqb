import {ConstructorResolver, ConstructorThunk} from '../types';
import {Type} from '../../types';

export function EntityLink<T>(type: ConstructorThunk<T>): EntityLinkDef<T> {
    return new EntityLinkDef<T>(type);
}

export class EntityLinkDef<T> {
    constructor(ctor: Type<T> | ConstructorResolver<T>) {
    }

    link<K extends keyof T>(keyColumn: K, parentColumn: string): this {
        return this;
    }

    as(alias: string): this {
        return this;
    }

    filter(conditions: object | object[]): this {
        return this;
    }
}

