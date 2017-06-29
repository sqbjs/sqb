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