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