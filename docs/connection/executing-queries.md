# Executing Queries

Queries can be executed as long as they are created by Connection or DbPool objects. Both Connection and DbPool objects have same methods within sqb namespace for creating queries. Just like sqb namespace, `.select()`, `.insert()`, `.update()`, `.delete()`, etc. is used to start query sequence. Unlike formal queries, this ones supports `.execute()` and `.then()` methods which executes the query.


## Query.execute([options])

This method executes the Query.

**Returns:** Returns a Promise<Object>.

- `options` (Object) : Execute options.
  - `values` (Array|Object) : Array of values or object that contains param/value pairs.
  - `autoCommit` (Boolean=false) : If this property is true, the transaction committed at the end of query execution.
  - `cursor` (Boolean=false) : If this property is true, query returns a `Cursor` object that works in unidirectional "cursor" mode. **Important!** `Cursor` keeps connection open until `cursor.close()` method is called.
  - `coercion` Function) : Function for converting data before returning response.
  - `fetchRows` (Number) : In "cursor" mode; it provides an initial suggested number of rows to prefetch. Prefetching is a tuning option to maximize data transfer efficiency and minimize round-trips to the database.
In regular mode; it provides the maximum number of rows that are fetched from Connection instance.
  - `ignoreNulls` (Boolean=false) : Determines whether object rows contains NULL fields.
  - `naming` (Enum`<String>`) : Sets the naming rule for fields. It affects field names in object rows and metadata.
    - lowercase: Table/field names are lower case characters
    - uppercase: Table/field names are upper case characters
  - `objectRows` (Boolean=false) : Determines whether query rows should be returned as Objects or Arrays. This property applies to ResultSet.objectRows property also.
  - `showSql` (Boolean=false): If set true, result object contains executed sql and values.
    
**Important! :** *Cursor keeps connection open till `cursor.close()` method is called. When the Cursor is no longer needed, it must be closed.*

**Example 1**
```js
require('sqb-connect-oracledb'); // Load oracledb wrappper pluging
const sqb = require('sqb');
const
db = sqb.pool({
    dialect: 'oracledb',
    user: 'anyuser',
    password: 'anypass',
    connectString: '192.168.0.1:1521/mydb'
});
db.select('current_date')
.execute().then(result => {
    console.log(result.rows);
})
```

**Example 2**
```js
db.select('current_date').execute().then(result => {
        console.log(result.rows);
    });
```

**Example 3**
```js
// Execute within a single transaction. Connection will be automatically closed after returned promise resolved.
db.acquire(connection => {
    return connection.select('current_date')
    .execute().then(result => {
        console.log(result.rows);        
    })
});
```
