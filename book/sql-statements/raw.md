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