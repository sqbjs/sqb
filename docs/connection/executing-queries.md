# Executing Queries

Queries can be executed as long as they are created by Connection or DbPool objects. Both Connection and DbPool objects have same methods within sqb namespace for creating queries. Just like sqb namespace, `.select()`, `.insert()`, `.update()`, `.delete()`, etc. is used to start query sequence. Unlike formal queries, this ones supports `.execute()` and `.then()` methods which executes the query.


## Query.execute([options], callback)

This method executes the Query and returns a result object.

**Returns:** If method is invoked without a callback, it returns a Promise. Otherwise it returns null.


***options*** [Object] : Object with few parameters
* ***autoCommit*** [Boolean=false]: If this property is true, then the transaction in the current connection is automatically committed at the end of query execution.
* ***extendedMetaData*** [Boolean=false]: Determines whether additional metadata is available for queries. If extendedMetaData is true then metaData will contain additional attributes.
* ***maxRows*** [Boolean]: The maximum number of rows that are fetched from Connection object. This property do nothing if ResultSet is used.
* ***resultSet*** [Boolean=false|Object]: Determines whether query results should be returned as a ResultSet object or directly. If resultSet is true, property enabled with default options. 
    * ***prefetchRows*** [Number]: Provides an initial suggested number of rows to prefetch when querying the database.
Prefetching is a tuning option to maximize data transfer efficiency and minimize round-trips to the database.
    * ***objectRows*** [Boolean=false]: Determines whether query rows should be returned as Objects or Arrays.
    * ***ignoreNulls*** [Boolean=false]: Determines whether object rows contains NULL fields.
    * ***cached*** [Boolean=false]: If this property is true, ResultSet is works with cached mode, that all fetched rows are cached in memory or other store. Cached ResultSets supports moving backward and locating first row without executing query again. Using cached mode is not suggested using with large datasets.
    * ***onfetchrow*** [Function]: This function is called whenever new row is fetched from database. This allows modifying values before cached or returning the result.
    
***callback*** [Function] : NodeJS callback function with parameters (error, result).

**Important! :** *ResultSet object keeps connection open till `ResultSet.close()` method is called. When the ResultSet is no longer needed, it must be closed.*


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
.execute((error, result) => {
    console.log(result.rows);
})
```

**Example 2**
```js
db.select('current_date')
.execute({
    maxRows: 10, 
    extendedMetaData: true
    }, (error, result) => {
        console.log(result.rows);
    }
);
```

**Example 3**
```js
// Execute within a single transaction
db.connect((err, connection) => {
    connection.select('current_date')
    .execute((error, result) => {
        console.log(result.rows);
        connection.close();
    })
});


```




## Query.then([options], callback)
Unlike `.execute()`, this method always returns Promise.

**Example**
```js
db.select('current_date')
.then({
    resultSet: true, 
    extendedMetaData: true
    }, (result) => {
        result.resultSet.next(row, next) {
          console.log(row);
          if (row)
              next();
          else result.resultSet.close();
        }
    }
).catch(e => {
  console.error(e);
});
```