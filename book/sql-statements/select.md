## 2.1 Creating "select" queries

`.select()` function in sqb namespace is used to start a sequence for creating select queries.

#### Usage

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