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