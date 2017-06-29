## 2.1 Creating "select" queries

`.select()` function in sqb namespace is used to start a sequence for creating select queries.

#### Sequence

```js
  sqb.select(...columns)
     .from(...tables)
     .join(...joins)
     .where(...conditions)
     .groupBy(...groups)
     .orderBy(...orders)
```


**.select(...*column*)**  
Starts a select query.  
*colums* [String|Raw|Case|SelectStatement] :  
Array of column names, raw expressions, case/when expressions and sub-selects.

```js
    sqb.select(
        'field1',                   // Column name
        'field2 as alias2',         // Column name with alias
        'field3 alias3',            // Column name with alias
        'table1.field4 alias4',     // Table and Column name with alias
        sqb.raw('func(1) alias5'),  // Raw expression
        sqb.case().when('field1', 5).then().as('alias6'),  // Case/when expression with alias
        sqb.select('a1').from('table2').as('alias7')       // sub select with alias
        )
       .from()       
```


**.from(...*table*)**  
Defines "from" part of select query.
*table* [String|Raw|SelectStatement] :  
Array of table/view names, raw expressions and sub-selects.
  
```js
  .from(
        'table1',                   // Table name
        'table2 as alias2',         // Table name with alias
        'table3 alias3',            // Table name with alias
        sqb.raw('func(1) alias5'),  // Raw expressions
        sqb.select('a1').from('table2')   // Sub-select
       )
```


**.join(...*join*)**  
Defines "join" part of select query.
*joins* [Join]  
Array of join expressions. Look at detailed use of [Join expressions](sql-statements/join.md)
```js
  .join(
        sqb.join('table1 t1').on(['t1.table2_id', raw('t2.id')]),      // join default inner join
        sqb.join('table2 as alias2').on(['field3','=',raw('field4')]), // Table name with alias
        sqb.join('table3').on('field1',raw('field2'))                  // Raw expression
        
        )
```


**.where(...*condition*)**  
Defines "where" part of select query. Arguments
in `.where()` method is passed to inner Condition Group. So same rules applies with `.where()`method. Look at detailed use of [Conditions](sql-statements/conditions.md)
 
 
**.groupBy(...*column*)**  
Defines "group by" part of select query.    
**column** [String] 
Array of column names.
 
```js
   .groupBy(
        "field1",     // Column name
        "t1.field2",  // Column name with table name
           )
```


**.orderBy(...*column*)**  
Defines "order by" part of select query.    
**column** [String] 
Array of column names following sort direction keywords optionally.

```js
   .orderBy(
        "field1",        // Column name
        "table2.field2", // Table name and field name
        "field3 asc",    // asc meaning order by ascending
        "field4 desc"    // desc meaning order by descending
        )
```