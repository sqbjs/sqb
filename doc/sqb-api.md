1. [Introduction](#Introduction)
1. [Serializing SQL statements](#serializing)
    * Defining SQL statements
        * *Select* statement
        * *Insert* statement
        * *Update* statement
        * *Delete* statement
        * *Raw*
        * *Join*'s
        * *Conditions*
        * *Case/when*
    * Serializing statements to SQL string
        * Choosing dialect
        * Pretty printing
        * Names vs Indexed params
    * Serializer class
        * Properties
        * Methods
        * Static Methods
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
1. [Exported members in SQB namespace](#sqbnamespaece)        
    * 4.1 [Methods](#sqb-methods)
        * [serializer()](#sqb-serializer)
        * [pool()](#sqb-pool)
        * [Helpers.flattenText()](#sqb-flattenText)     
        * [Helpers.promisify()](#sqb-promisify)
    * 4.2 [Properties](#sqb-Properties)
        * [promiseClass](#sqb-promiseClass)
    * 4.3 [Classes](#sqb-Classes)
        * [SelectStatement class](#sqb-SelectStatement)
            * Properties
            * Methods
        * [InsertStatement class](#sqb-InsertStatement)
            * Properties
            * Methods
        * [UpdateStatement class](#sqb-UpdateStatement)
            * Properties
            * Methods
        * [DeleteStatement class](#sqb-DeleteStatement)
            * Properties
            * Methods
        * [DbPool class](#sqb-DeleteStatement)
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

# <a name="serializing"></a> 2. Serializing SQL statements

# <a name="connecting"></a> 3. Connecting and working with Databases

# <a name="connecting"></a> 4. Exported members in SQB namespace

## <a name="sqbnamespac-exports"></a>4.1 Methods

## <a name="sqb-methods"></a>4.2 Methods

### <a name="sqb-serializer"></a> .serializer()
Creates and initializes new Serializer class for desired dialect.

*Note: No dialects included in SQB package by default. Before using any dialect, be sure you have loaded its serialization plugin.*

#### Variations

`sqb.serializer(String dialect)`

*dialect:* Name of the sql dialect to use when serializing.
 

**Example**
```js
require('sqb-serializer-oracle');
const sqb = require('sqb');
const sr = sqb.serializer('oracle');
```

`sqb.serializer(Object config)`

*config:* Object with configuration parameters

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
