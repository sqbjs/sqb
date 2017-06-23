1. [Introduction](#1-introduction)
    * [Installation](#11-installation)
1. [Coding SQL statements with SQB](#2-coding-sql-statements-with-sqb)     
    * [Select statement](#21-select-statement)
    * [Insert statement](#22-insert-statement)
    * [Update statement](#23-update-statement)
    * [Delete statement](#24-delete-statement)
    * [Join expressions](#25-join-expressions)
    * [SQL Conditions](#26-sql-conditions)
    * [Raw expressions](#27-raw-expressions)
    * [Case/when expressions](#28-casewhen-expressions)
1. [Serializing statements to SQL string](#3-serializing-statements-to-sql-string)
    * [Choosing dialect](#31-choosing-dialect)
    * [Pretty printing](#32-pretty-printing)
    * [Named vs Indexed params](#33-named-vs-indexed-params)
1. [Connecting and working with Databases](#4-connecting-and-working-with-databases)
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
    * 5.1 [Methods](#sqb-methods)
        * [serializer()](#sqb-serializer)
        * [pool()](#sqb-pool)                     
    * 5.2 [Properties](#sqb-Properties)
        * [promiseClass](#sqb-promiseClass)
    * 5.3 [Classes](#sqb-Classes)
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

# 1. Introduction

## 1.1 Installation
`
npm install sqb --save
`

# 2. Coding SQL statements with SQB

## 2.1 Select statement

*Usage*

```js
  sqb.select(...columns)
     .from(...tables)
     .join(...joins)
     .where(...conditions)
     .groupBy(...groups)
     .orderBy(...orders)
```

**columns** [String|Raw|Case|SelectStatement] :  
Array of columns. String representation of column names, raw strings, case/when expressions and sub-selects are accepted.

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

**tables** [String|Raw|SelectStatement] :  
Array of tables. String representation of table/view names, raw strings and sub-selects are accepted.  
```js
  .from(
        'table1',   // Table name
        'table2 as alias2',     // Table name with alias
        'table3 alias3',        // Table name with alias
        sqb.raw('func(1) alias5'),  // Raw expressions
        sqb.select('a1').from('table2')   // Sub-select
       )
```

**joins** [Join|Raw]
```js
  .join(
        sqb.join('table1 t1').on(['t1.table2_id', raw('t2.id')]),   // join default inner join
        sqb.join('table2 as alias2').on(['field3','=',raw('field4')]), // Table name with alias
        sqb.join('table3').on('field1',raw('field2')) // Raw expression
        
        )
```

**conditions**[Condition|Array|String]
Array using for grouping. String using for use logical operator.

```js
  .where(
        ['field1',5],  // Condition meaning field = value.


        ['field2','<',10], //Column name with operators
        ['field3','>',1],
        ['field4','<=',2],
        ['field5','>=',4],
        ['field6','!=',6],
        ['field7','<>',12],
        ['field8','like','ecem'],
        ['field9','between',[5,10]],


     [
        ['field9',21],
         'or'                  // logical operator
        ['field10',23]
     ],


        sqb.select('a1').from('table2')  // Sub-select
        )
```

**groups** [String]
```js
   .groupBy(
        "field1"   // Column name
           )
```

**orders** [String]
```js
   .orderBy(
        "field1",   // Column name
        "table2.field2", // Table name and field name
        "field3 asc",  // asc meaning order by ascending
        "field4 desc" // desc meaning order by descending
        )
```

## 2.2 Insert statement
*Usage*

```js
    sqb.insert(...columns)
       .into(...tables) 
       .values(...object)
```

**columns** [String]
```js
   sqb.insert('field1','field2','field3')  // Field name
 ```
 
 **tables** [String]
 ```js
    .into(
    'table1',  // Table name
    'table2 t2',  // Table name with alias
    'table3 as t3'  // Table name with alias 
    )
 ```   
**object**[String|Array]
```js
    .values(
    
    [10,'panates',5],
    
    {
    field1: 13,
    field2: 'panates',
    field3: 5
    }
    
    )
```

## 2.3 Update statement
*Usage*

```js
   sqb.update(...table)
      .set(...columns)
      .where(...conditions)
```   


**table**[String]
```js
   sqb.update('table1')  // Table name
   ```

**columns**[String| Subselect]
```js
     .set(
  {
        'field1':1234,     // Field name
  }
  {
     sqb.select('a1').from('table2')  // Sub-select
  }
 )
```


**conditions**[Condition|Array|String]
Array using for grouping. String using for use logical operator.

```js
  .where(
        ['field1',5],  // Condition meaning field = value.


        ['field2','<',10], //Column name with operators
        ['field3','>',1],
        ['field4','<=',2],
        ['field5','>=',4],
        ['field6','!=',6],
        ['field7','<>',12],
        ['field8','like','ecem'],
        ['field9','between',[5,10]],


     [
        ['field9',21],
         'or'                  // logical operator
        ['field10',23]
     ],


        sqb.select('a1').from('table2')  // Sub-select
        )
```

## 2.4 Delete statement
*Usage*

```js
    sqb.delete(...columns)
       .from(...tables)
       .where(...conditions)
 
```

**columns** [String]
```js
    sqb.delete('field1','field2','field3')  // Column name
 ```
 
 **tables** [String|Raw|SelectStatement] :  
Array of tables. String representation of table/view names, raw strings and sub-selects are accepted.  
```js
     .from(
        'table1',   // Table name
        'table2 as alias2',     // Table name with alias
        'table3 alias3',        // Table name with alias
        sqb.raw('func(1) alias5'),  // Raw expressions
        sqb.select('a1').from('table2')   // Sub-select
       )
```

**conditions**[Condition|Array|String]
Array using for grouping. String using for use logical operator.

```js
     .where(
        ['field1',5],  // Condition meaning field = value.


        ['field2','<',10], //Column name with operators
        ['field3','>',1],
        ['field4','<=',2],
        ['field5','>=',4],
        ['field6','!=',6],
        ['field7','<>',12],
        ['field8','like','ecem'],
        ['field9','between',[5,10]],


     [
        ['field9',21],
         'or'                  // logical operator
        ['field10',23]
     ],


        sqb.select('a1').from('table2')  // Sub-select
        )
```

## 2.5 Join expressions
*Usage*

```js
sqb.join(...source)
     .on(...conditions)
```

**source** [String|Raw|SelectStatement] :


  ```js
      .join(
      sqb.join('table1').on(['table1.table2_id', 1]),  //Table name
      sqb.join('table1 as t1').on(['t1.table2_id', raw('t2.id')]),   // Table name with alias
      sqb.join(sqb.select('table1_ID','field1').from('table1').where('table1.field2','TOKYO')).on(['t2.table2_ID',raw('table1_ID'), //Sub-select
      sqb.join(raw('select table1_ID,field1 from table1 where table1.field2= \'Tokyo\'')).on(['t2.table2_ID', raw('t1.table1_ID')]) , //Raw-sub select statement
      sqb.join(raw('table1 on table1_id=table2_id')),  // Raw expression 
           //other join types
        sqb.innerJoin('table3').on('field1',raw('field2')),
        sqb.leftJoin('table5').on(['table5.field7_id',raw('table6.id')]),
        sqb.rightJoin('table6 t6').on(['t6.table6_id', raw('t7.id')]),
        sqb.outerJoin('table7 t7').on(['t7.table7_id', raw('t8.id')]),
        sqb.fullOuterJoin('table8 t8').on(['t9.table9_id', raw('t9.id')]),
        sqb.leftOuterJoin('table9 as t9').on(['t9.table9_id', raw('t10.id')]),
        sqb.rightOuterJoin('table10 t10').on(['t10.table10_id', raw('t11.id')])
        


```


**conditions** [String|Raw|SelectStatement] :
 ```js
     .on(
        ['t2.table2_id', raw('t1.id')], // Column name
        ['t2.table2_id  as t2_ ID', raw('t1.id')], // Column name with alias
        ['table2.table2_ID','=',raw('(select table1_ID from table1 where table1_ID < 7)')],  // Raw-sub select statement
        ['table2.table2_ID','=',sqb.select('table1_ID').from('table1').where(['table1_ID', '<', 7])]  // Sub-select

        )
  ```
     
## 2.6 SQL conditions




**conditions**[Condition|Array|String]
Array using for grouping. String using for use logical operator.

```js
     .where(
        ['field1',5],  // Condition meaning field = value.


        ['field2','<',10], //Column name with operators
        ['field3','>',1],
        ['field4','<=',2],
        ['field5','>=',4],
        ['field6','!=',6],
        ['field7','<>',12],
        ['field8','like','ecem'],
        ['field9','between',[5,10]],


     [
        ['field9',21],
         'or'                  // logical operator
        ['field10',23]
     ],


        sqb.select('a1').from('table2')  // Sub-select
        )
```

## 2.7 Raw expressions

*Usage*
```js
    sqb.raw(...rawSQL)
  ```
**rawSQL**[String|Subselect|Case]
```js
      sqb.raw(
       't1.id', // Column name
       'func(1) alias5',  // using alias
       'select table1_ID,field1 from table1 where table1.field2= \'Tokyo\'' , // Sub-select
        sqb.case().when('field1', 5).then().as('alias6')  // Case/when expression with alias
        )
   ```     
## 2.8 Case/when expressions

*Usage*
```js
    sqb.case(..column)
       .when(...conditions)
       .then(...Value)
       .else(...Value)
       .as(...alias)
   ```
   
   
   **column**[String]
 ```js
   sqb.case(
   'field1',               // Column name
   'field2 as alias2'     // Column name with alias
    )
  ```
   
   **conditions** [Condition|String]
  ```js 
       .when(
           ['field1',5],  // Condition meaning field = value.


           ['field2','<',10], //Column name with operators
           ['field3','>',1],
           ['field4','<=',2],
           ['field5','>=',4],
           ['field6','!=',6],
           ['field7','<>',12],
           ['field8','like','ecem'],
           ['field9','between',[5,10]]
   )
 ```
# <a name="connecting"></a>3. Serializing statements to SQL string
## 3.1 Choosing dialect

## 3.2 Pretty printing


## 3.3 Named vs Indexed params



# <a name="connecting"></a>4. Connecting and working with Databases
## 4.1

# <a name="connecting"></a>5. Exported members in SQB namespace

## <a name="sqbnamespac-exports"></a>5.1 Methods

## <a name="sqb-methods"></a>5.2 Methods

### <a name="sqb-serializer"></a> .serializer()
Creates and initializes new Serializer object for desired dialect.

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
