1. [Introduction](./body.md#Introduction)
1. [sqb namespace](./body.md#sqb-namespace)
    * Exports
    * Methods
1. Serializing SQL statements
    * Defining 'select' statements
    * Defining 'insert' statements
    * Defining 'update' statements
    * Defining 'delete' statements
    * Serializing statements to SQL string
        * Choosing dialect
        * Pretty printing
        * Names vs Indexed params
    * Serializer class
        * Properties
        * Methods
        * Static Methods
    * SelectStatement class
    * InsertStatement class
    * UpdateStatement class
    * DeleteStatement class
1. Connecting and working with Databases
    * Bridging with database drivers
    * Configuring connection pool
    * Executing statements
    * Executing Raw SQLs
    * Transactions
    * Working with Meta-Data
        * Querying schemas
        * Querying tables
        * Querying primary key constraints
        * Querying foreign key constraints
    * DbPool class
        * Properties
        * Methods
        * Static Methods
    * Connection class
        * Properties
        * Methods
    * MetaData class
        * Properties
        * Methods    
    * ResultSet class
        * Properties
        * Methods
