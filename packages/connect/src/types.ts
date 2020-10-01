import {Session} from './Session';
import {FieldInfoMap} from './FieldInfoMap';
import {Cursor} from './Cursor';

export type Maybe<T> = T | void | null;

export type CoercionFunction = (value: any, fieldInfo?: FieldInfo) => any;
export type TransactionFunction = (session: Session) => Promise<void>;
export type ExecuteHookFunction = (session: Session, prepared: PreparedQuery) => Promise<void>;
export type FetchFunction = (row: any, prepared: PreparedQuery) => void;

export type RowType = 'array' | 'object';
export type FieldNaming = 'lowercase' | 'uppercase' | 'camelcase' |
    'pascalcase' | ((fieldName: string) => string);
export type ObjectRow = Record<string, any>;
export type ArrayRow = any[];
export type ObjectRowset = ObjectRow[];
export type ArrayRowset = ArrayRow[];

export interface ConnectionConfiguration {
    /**
     * Database connection driver to be used
     */
    driver: string;

    /**
     * Connection name
     */
    name?: string;

    /**
     * Database address or connection string
     */
    host?: string;

    /**
     * Database listener port number
     *
     */
    port?: number;
    /**
     * Database username.
     */
    user?: string;

    /**
     * Database password.
     */
    password?: string;

    /**
     * Database name
     */
    database?: string;

    /**
     * Database schema
     */

    schema?: string;

    /**
     * Connection options to be passed to the underlying driver
     */
    driverOptions?: any;

    /**
     * Pooling options
     */
    pool?: {
        /**
         * The maximum times that Pool will try to create a connection before returning error.
         * Default = 0
         */
        acquireMaxRetries?: number;

        /**
         * Time in millis that Pool will wait after each tries.
         * Default = 2000
         */
        acquireRetryWait?: number;

        /**
         * Time in millis an acquire call will wait for a connection before timing out.
         * Default = 0
         */
        acquireTimeoutMillis?: number;

        /**
         * The minimum amount of time in millis that a connection may sit idle in the Pool.
         * Default = 30000
         */
        idleTimeoutMillis?: number;

        /**
         * The maximum number of connections that can be open in the connection pool.
         * Default = 10
         */
        max?: number;

        /**
         * The maximum number of request that Pool will accept.
         * Default = 1000
         */
        maxQueue?: number;

        /**
         * The minimum number of connections a connection pool maintains,
         * even when there is no activity to the target database.
         * Default = 0
         */
        min?: number;

        /**
         * The minimum number of idle connections a connection pool maintains,
         * even when there is no activity to the target database.
         * Default = 0
         */
        minIdle?: number;

        /**
         *  Tests connection before acquire if true
         *  Default = false
         */
        validation?: boolean;

    }

    /**
     * Default options
     */
    defaults?: {
        autoCommit?: boolean;
        createCursor?: boolean;
        objectRows?: boolean;
        fieldNaming?: FieldNaming;
        showSql?: boolean;
        ignoreNulls?: boolean;

        /**
         * Sets how many row will be fetched at a time
         * Default = 10
         */
        fetchRows?: number;

        coercion?: CoercionFunction;
    }

}

export interface QueryExecuteOptions {
    /**
     * Array of values or object that contains param/value pairs.
     */
    values?: Record<string, any> | any[];

    /**
     *  If this property is true, the transaction committed at the end of query execution.
     *  Default = false
     */
    autoCommit?: boolean;

    /**
     * If this property is true, query returns a Cursor object that works
     * in unidirectional "cursor" mode.
     * Important! Cursor keeps connection open until cursor.close() method is called.
     */
    createCursor?: boolean;

    /**
     * Function for converting data before returning response.
     */
    coercion?: CoercionFunction;

    /**
     * In "cursor" mode; it provides an initial suggested number of rows to prefetch.
     * Prefetching is a tuning option to maximize data transfer efficiency and
     * minimize round-trips to the database. In regular mode;
     * it provides the maximum number of rows that are fetched from Connection instance.
     * Default = 10
     */
    fetchRows?: number;

    /**
     * If set true, NULL fields will be ignored
     * Default = false
     */
    ignoreNulls?: boolean;

    /**
     * Sets the naming strategy for fields. It affects field names in object rows and metadata
     */
    namingStrategy?: 'lowercase' | 'uppercase' | 'camelCase' | ((fieldName: string) => string);

    /**
     * Determines whether query rows should be returned as Objects or Arrays.
     * This property applies to ResultSet.objectRows property also.
     * Default = driver default
     */
    objectRows?: boolean;

    /**
     * If set true, result object contains executed sql and values.
     * Default = false
     */
    showSql?: boolean

    action?: string;

}

export interface AcquireSessionOptions {
    inTransaction?: boolean;
}

export interface PreparedQuery {
    sql: string;
    values?: any;
    autoCommit?: boolean;
    createCursor?: boolean;
    objectRows?: boolean;
    ignoreNulls?: boolean;
    fetchRows?: number;
    fieldNaming?: FieldNaming;
    coercion?: CoercionFunction;
    showSql?: boolean;
    action?: string;
    executeHooks?: ExecuteHookFunction[];
    fetchHooks?: FetchFunction[];
    // returningParams?: any;
}

export interface QueryResult {
    executeTime: number;
    fields?: FieldInfoMap;
    rows?: Record<string, any>[] | any[][];
    rowType?: RowType;
    query?: PreparedQuery
    returns?: any;
    rowsAffected?: number;
    cursor?: Cursor;
}

export interface FieldInfo {
    name: string;
    fieldName: string;
    index: number;
}
