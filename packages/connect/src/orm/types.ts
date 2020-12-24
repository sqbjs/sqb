import type {Operator} from '@sqb/builder';

export type Constructor<T = {}> = new (...args: any[]) => T;
export type ConstructorThunk<T = {}> = () => Constructor<T> | Promise<Constructor<T>>;

export type AutoGenerationStrategy = 'increment' | 'uuid' | 'rowid';
export type ColumnTransform = (value: any, row?: any) => any;
export type LazyResolver<T> = (options?: FindOptions) => Promise<T>;

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
    /**
     * Column data type
     */
    type?: string

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
    autoGenerate?: AutoGenerationStrategy;

    /**
     * Indicates column can be sorted ascending order
     */
    sortAscending?: boolean;

    /**
     * Indicates column can be sorted descending order
     */
    sortDescending?: boolean;

    /**
     * Indicates if column is read only
     */
    readOnly?: boolean;

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

export interface RelationColumnConfig {
    target: Constructor | ConstructorThunk;
    column: string | string[];
    targetColumn: string | string[];
    lazy?: boolean;
}

export interface FindByPkOptions {
    columns?: string[];
}

export type SearchFilter = object | Operator | (object | Operator)[];

export interface FindOneOptions {
    columns?: string[];
    filter?: SearchFilter;
    sort?: string[];
    offset?: number;
}

export interface FindOptions extends FindOneOptions {
    limit?: number;
    maxEagerFetch?: number;
}
