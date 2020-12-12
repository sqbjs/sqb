import {Operator} from '@sqb/builder';

export type Constructor<T = {}> = new (...args: any[]) => T;

export type AutoGenerationStrategy = 'increment' | 'uuid' | 'rowid';


export interface EntityOptions {
    /**
     *  Name of the table name. Default: entity class name.
     */
    name?: string;

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
     *  Name of the primary index
     */
    name?: string;

    /**
     * Specifies if index is unique
     */
    unique?: boolean;
}

export interface ColumnOptions {
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
    array?: boolean;

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

export interface FindByPkOptions {
    elements?: string[];
}

export interface FindOneOptions {
    elements?: string[];
    filter?: Operator[];
    sort?: string[];
    offset?: number;
}

export interface FindOptions extends FindOneOptions {
    limit?: number;
}
