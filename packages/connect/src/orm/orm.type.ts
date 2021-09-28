import {Type} from 'ts-gems';
import {DataType} from '..';

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

export interface EntityConfig {
    /**
     *  Name of the table name. Default: entity class name.
     */
    tableName?: string;

    /**
     * Schema name which entity belongs to
     */
    schema?: string;

    /**
     * Table comment
     */
    comment?: string;
}

export interface IndexOptions {
    /**
     *  Name of the index
     */
    name?: string;

    /**
     * Specifies if index is unique
     */
    unique?: boolean;
}

export interface AssociationSettings {
    source: TypeThunk;
    target: TypeThunk;
    sourceKey?: string;
    targetKey?: string;
    kind?: AssociationKind;
}

export interface DataPropertyOptions {
    /*
      JS type
     */
    type?: Function;

    /**
     * Column data type
     */
    dataType?: DataType;

    /**
     *
     */
    isArray?: boolean;

    /**
     * Field name in the database table. Default: property name
     */
    fieldName?: string;

    /**
     * Field comment
     */
    comment?: string;

    /**
     * Character or byte length of column
     */
    length?: number;

    /**
     * Column's default value
     */
    default?: FieldValue | DefaultValueGetter;

    /**
     * The precision for a decimal field
     */
    precision?: number;

    /**
     * The scale for a decimal field
     */
    scale?: number;

    /**
     * Fields's collation.
     */
    collation?: string;

    /**
     * Indicates auto generation strategy
     */
    autoGenerated?: ColumnAutoGenerationStrategy;

    /**
     * Indicates enum values
     */
    enum?: EnumValue;

    /**
     * Indicates if column value can be null
     */
    notNull?: boolean;

    /**
     * Indicates whether or not to hide this column by default when making queries.
     */
    hidden?: boolean;

    /**
     * Indicates if column value is used in update queries
     */
    noUpdate?: boolean;

    /**
     * Indicates if column value is used in insert queries
     */
    noInsert?: boolean;
}

export interface EmbeddedTypeOptions {
    fieldNamePrefix?: string;
    fieldNameSuffix?: string;
}
