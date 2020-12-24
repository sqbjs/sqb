import type {Operator} from '@sqb/builder';

export type Constructor<T = {}> = new (...args: any[]) => T;
export type ConstructorThunk<T = {}> = () => Constructor<T> | Promise<Constructor<T>>;

export type AutoGenerationStrategy = 'increment' | 'uuid' | 'rowid';

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
     * Field name in the database table. Default: property nam
     */
    fieldName?: string;

    /**
     * Field comment
     */
    comment?: string;

    /**
     * Character or byte length of field
     */
    length?: number;

    /**
     * Specifies if field can be NULL
     */
    nullable?: boolean;

    /**
     * Specifies field's default value
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
     * Specifies fields's collation.
     */
    collation?: string;

    /**
     * Specifies enum values
     */
    enum?: (string | number)[] | Object;

    /**
     * Specifies if field is an array
     */
    isArray?: boolean;

    /**
     * Specifies auto generation strategy
     */
    autoGenerate?: AutoGenerationStrategy;

    /**
     * Specifies column can be sorted ascending order
     */
    sortAscending?: boolean;

    /**
     * Specifies column can be sorted descending order
     */
    sortDescending?: boolean;
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
