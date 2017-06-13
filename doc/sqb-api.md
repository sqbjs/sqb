1. [Introduction](#introduction)
    * [Installation](#installation)
1. [Coding SQL statements with SQB](#coding)     
    * Select statement
    * Insert statement
    * Update statement
    * Delete statement
    * Join expressions
    * SQL Conditions
    * Raw expressions
    * Case/when expressions
1. [Serializing statements to SQL string](#serializing)
    * Choosing dialect
    * Pretty printing
    * Names vs Indexed params
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
        * [DbPool class](#sqb-DbPool)
            * Properties
                * dialect
                * config                
            * Methods
                * connect()
                * testConnection()
                * meta()
            * Static Methods
                * register()
                * get()
                * create()
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

# <a name="coding"></a> 2. Coding SQL statements with SQB

## <a name="coding"></a> 2.1 Select statement

*Usage*

```js
  sqb.select(...columns)
     .from(...tables)
     .join(...joins)
     .where(...conditions)
     .groupBy(...groups)
     .orderBy(...orders)
```

**columns**: Array of columns. String representation of column names, raw strings, case/when expressions and sub-selects are accepted.

  ```js
    sqb.select(
        'field1',               // Column name
        'field2 as alias2',     // Column name with alias
        'field3 alias3',        // Column name with alias
        'table1.field4 alias4', // Table and Column name with alias
        sqb.raw('func(1) alias5'),      // Raw expressions
        sqb.case().when('field1', 5).then().as('alias6'),  // Case/when expression with alias
        sqb.select('a1').from('table2').as('alias7')       // sub select with alias
        )
       .from()       
```

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
