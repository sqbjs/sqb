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