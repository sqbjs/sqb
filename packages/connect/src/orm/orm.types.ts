import type {ColumnDefinition} from './ColumnDefinition';
import type {Repository} from './Repository';

/* Model related */

export type ColumnAutoGenerationStrategy = 'increment' | 'uuid' | 'rowid' |
    'timestamp' | 'custom';
export type SortDirection = 'ascending' | 'descending' | 'both';

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
    autoGenerate?: ColumnAutoGenerationStrategy;

    /**
     * Indicates column can be sorted ascending order
     */
    sortAscending?: boolean;

    /**
     * Indicates column can be sorted descending order
     */
    sortDescending?: boolean;

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

export interface RelationColumnConfig {
    target: Constructor | ConstructorThunk;
    column: string | string[];
    targetColumn: string | string[];
    lazy?: boolean;
}

/* Repository related */

export type LazyResolver<T> = (options?: Repository.FindAllOptions) => Promise<T>;

type IfEquals<X, Y, A = X, B = never> =
    (<T>() => T extends X ? 1 : 2) extends (<T>() => T extends Y ? 1 : 2) ? A : B;

export type WritableKeys<T> = {
    [P in keyof T]-?: IfEquals<{ [Q in P]: T[P] }, { -readonly [Q in P]: T[P] }, P>
}[keyof T];

export type ReadonlyKeys<T> = {
    [P in keyof T]-?: IfEquals<{ [Q in P]: T[P] }, { -readonly [Q in P]: T[P] }, never, P>
}[keyof T];

export type PickWritable<T> = Pick<T, WritableKeys<T>>;
