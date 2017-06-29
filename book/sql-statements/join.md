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