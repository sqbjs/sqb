import {Type} from 'ts-gems';

export type Ctor = Type | Function;

/* Model related */
export type ElementKind = 'column' | 'object' | 'association';

export type AssociationKind = 'to' | 'to-many' | 'from' | 'from-many';

/**
 * Indicates auto generation strategy
 */
export type ColumnAutoGenerationStrategy = 'increment' | 'uuid' | 'rowid' |
    'timestamp' | 'custom';

export type ColumnTransformFunction = (value: any, name: string) => any;

export type TypeResolver<T> = () => Type<T> | Promise<Type<T>>;
export type TypeThunk<T = any> = Type<T> | TypeResolver<T>;

export type EnumValue = (FieldValue)[] | Object;

export type FieldValue = string | number | boolean | Date | null;
export type DefaultValueGetter = (obj?: any) => FieldValue;

export interface AssociationSettings {
    source: TypeThunk;
    target: TypeThunk;
    sourceKey?: string;
    targetKey?: string;
    kind?: AssociationKind;
}
