export interface ConnectionOptions {
    /**
     * Database type / driver to be used
     */
    type: string;
    /**
     * Connection name
     */
    name?: string;
    /**
     * Database address or connection string
     */
    host: string;
    /**
     * Database listener port number
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
     * Default options
     */
    defaults: {
        autoCommit?: boolean;
        cursorMode?: boolean;
        objectRows?: boolean;
        fieldNames?: 'lowercase' | 'uppercase' | 'camelCase';
        showSql?: boolean;
    }

}

export interface Adapter {

}
