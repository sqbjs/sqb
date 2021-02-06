import type {ColumnDefinition} from './ColumnDefinition';
import type {Repository} from './Repository';
import {DataType} from '..';

/* Model related */

export type ColumnAutoGenerationStrategy = 'increment' | 'uuid' | 'rowid' |
    'timestamp' | 'custom';

export type ColumnTransformFunction = (value: any, col: ColumnDefinition, row: any) => any;
export type Constructor<T = {}> = new (...args: any[]) => T;
export type ConstructorResolver<T> = () => Constructor<T> | Promise<Constructor<T>>;
export type ConstructorThunk<T = {}> = Constructor<T> | ConstructorResolver<T>;

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

export interface IndexConfig {
    /**
     *  Name of the primary index
     */
    name?: string;

    /**
     * Specifies if index is unique
     */
    unique?: boolean;
}

export interface ColumnConfig {
    /*
      JS type
     */
    type?: Function;

    /**
     * Column data type
     */
    dataType?: DataType

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
     * Indicates if column can be NULL
     */
    nullable?: boolean;

    /**
     * Column's default value
     */
    defaultValue?: any;

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
     * Indicates enum values
     */
    enum?: (string | number)[] | Object;

    /**
     * Indicates if column data is an array
     */
    isArray?: boolean;

    /**
     * Indicates auto generation strategy
     */
    autoGenerate?: ColumnAutoGenerationStrategy;

    /**
     * Indicates if column is required
     */
    required?: boolean;

    /**
     * Indicates whether or not to hide this column by default when making queries.
     */
    hidden?: boolean;

    /**
     * Indicates if updating column value is permitted.
     */
    update?: boolean;

    /**
     * Indicates if column value is used when inserting
     */
    insert?: boolean;
}

export interface GroupColumnConfig {
    type: ConstructorThunk;
    fieldNamePrefix?: string;
    fieldNameSuffix?: string;
}

export interface RelationColumnConfig {
    target: ConstructorThunk;
    column: string | string[];
    targetColumn: string | string[];
    lazy?: boolean;
}

/* Repository related */

export type LazyResolver<T> = (options?: Repository.FindAllOptions) => Promise<T>;
