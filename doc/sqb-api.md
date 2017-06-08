1. [Introduction](#Introduction)
1. [Namespace](#sqbnamespace)
    * 2.1 [Exports](#sqbnamespac-exports)
    * 2.2 [Methods](#sqbnamespac-methods)
        * 2.2.1 [serializer()](#sqbnamespac-methods-serializer) 
1. [Namespace](#serializing-sql-statements) Serializing SQL statements
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

# <a name="introduction"></a> 1. Introduction

# <a name="sqbnamespace"></a> 2. Namespace

## <a name="sqbnamespac-exports"></a>2.1 Exports

## <a name="sqbnamespac-methods"></a>2.2 Methods

### <a name="sqbnamespac-methods-serializer"></a>2.2.1 serializer()
Creates and initializes new Serializer class for desired dialect.

**Usage**

`serializer(String dialect)`

*dialect:* Name of the sql dialect to use when serializing.
 
*Note: No dialects included in SQB package by default. Before using any dialect, be sure you have loaded its serialization plugin.*

**Example**
```js
require('sqb-serializer-oracle');
const sqb = require('sqb');
const sr = sqb.serializer('oracle');
```

`serializer(Object config)`

**Example**
```js
require('sqb-serializer-oracle');
const sqb = require('sqb');
const sr = sqb.serializer({
  dialect: 'oracle',
  prettyPrint: true,
  namedParams: true
})
```

# <a name="serializing-sql-statements"></a> 3. Serializing SQL statements