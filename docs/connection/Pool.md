# Pool Class

When applications use a lot of connections for short periods, we recommend using a connection pool for efficiency. Each pool can contain one or more connections. A pool can grow or shrink, as needed. Each Node process can use one or more local pools of connections.

**Note**: Before initializing a connection pool, required dialect extension must be loaded.

## Index

#### Properties
- [config](#config)
- [dialect](#dialect)
- [user](#user)
- [schema](#schema)
- [isClosed](#isclosed)
- [acquired](#acquired)
- [acquired](#acquired)
- [available](#available)
- [pending](#pending)
- [size](#size)
- [state](#state)
- [metaData](#state)

#### Methods
- [Pool.prototype.start()](#poolprototypestart)
- [Pool.prototype.close()](#poolprototypeclose)
- [Pool.prototype.acquire()](#poolprototypeacquire)
- [Pool.prototype.execute()](#poolprototypeexecute)

- [Pool.prototype.select()](#poolprototypeselect)
- [Pool.prototype.insert()](#poolprototypeinsert)
- [Pool.prototype.update()](#poolprototypeupdate)
- [Pool.prototype.delete()](#poolprototypedelete)
- [Pool.prototype.case()](#poolprototypecase)
- [Pool.prototype.raw()](#poolprototyperaw)
- [Pool.prototype.join()](#poolprototypejoin)
- [Pool.prototype.innerJoin()](#poolprototypeinnerjoin)
- [Pool.prototype.leftJoin()](#poolprototypeleftjoin)
- [Pool.prototype.leftOuterJoin()](#poolprototypeleftouterjoin)
- [Pool.prototype.rightJoin()](#poolprototyperightjoin)
- [Pool.prototype.rightOuterJoin()](#poolprototyperightouterjoin)
- [Pool.prototype.outerJoin()](#poolprototypeouterjoin)
- [Pool.prototype.fullOuterJoin()](#poolprototypefullouterjoin)

#### Events
- [close](#closeevent)
- [execute](#executeevent)


<hr/>

## Construction

SQB namespace exposes Pool class. And also SQB namespace has `pool()` function that creates Pool instance.

`pool = new sqb.Pool(options)`

`pool = sqb.pool(options)`

- `options` (Object): Object with few parameters to configure connection pool
    - `dialect` (String): Name of the dialect to be used when serializing.
    - `user` (String): Database user name. 
    - `password` (String): Database password.
    - `database` (String): Database path or connection string. 
    - `schema` (String): Default schema.
    - `pool` (Object): Pooling options
      - `acquireMaxRetries` (Number=0): The maximum times that Pool will try to create a connection before returning error.
      - `acquireRetryWait` (Number=2000): Time in millis that Pool will wait after each tries.
      - `acquireTimeoutMillis` (Number=0): Time in millis an acquire call will wait for a connection before timing out.
      - `idleTimeoutMillis` (Number=30000): The minimum amount of time in millis that a connection may sit idle in the Pool.
      - `max` (Number=10): The maximum number of connections that can be open in the connection pool. 
      - `maxQueue` (Number=1000): The maximum number of request that Pool will accept.
      - `min` (Number=0): The minimum number of connections a connection pool maintains, even when there is no activity to the target database.
      - `minIdle` (Number=0): The minimum number of idle connections a connection pool maintains, even when there is no activity to the target database.
      - `validation` (Boolean=false): If true Pool will test connection before acquire.
  - `defaults` (Object): Default options
    - `autoCommit` (Boolean=false): Sets the default value of autoCommit option of query execution.
    - `cursor` (Boolean=false): 
    - `objectRows` (Boolean=false): Sets the default  value of objectRows option of query execution.
    - `naming` (String): [Enum`<String>`] : Sets the default naming rule for fields.
    - `fetchRows` (Number) : Sets default fetchRows property of execution options.


## Properties

### config
*getter (Object)*

This is a read only property that returns the configuration object given at creation time.
    
### dialect
*getter (String)*

This is a read only property to shortcut to *dialect* property in the configuration object.

### user
*getter (String)*

This is a read only property to shortcut to *user* property in the configuration object.
    
### schema
*getter (String)*

This is a read only property to shortcut to *schema* property in the configuration object.
    
### isClosed
*getter (Boolean)*

Returns true if pool is closed, false otherwise.

### size
*getter (Number)*

Returns number of total connections.

### acquired
*getter (Number)*

Returns number of acquired connections.

### available
*getter (Number)*

Returns number of idle connections.

### pending
*getter (Number)*

Returns number of acquire request waits in the Pool queue.

### state
*getter ([PoolState](types/PoolState.md))*

Returns current state of the Pool.

### metaData
Retuns [MetaData](connection/MetaData.md) instance that helps working with database meta-data.

`pool.metaData.query(...)`

<hr/>
## Methods

### Pool.prototype.start()
Starts the `Pool` and begins creating of resources, starts house keeping and any other internal logic.

`pool.start()`

*Note: This method is not need to be called. `Pool` instance will automatically be started when acquire() method is called*  

### Pool.prototype.close()
This method terminates the connection pool.

Any open connections should be released with `Connection.close()` before pool.close() is called.

`pool.close()`
    
- **Returns** Returns Promise.    

```js
pool.close().then(() => {
  console.log('Pool terminated');
}).catch(error => {
  console.error(error);
});
```

### Pool.prototype.acquire()

This method obtains a connection from the connection pool. If a previously opened connection is available in the pool, that connection is returned. If all connections in the pool are in use, a new connection is created and returned to the caller, as long as the number of connections does not exceed the specified maximum for the pool. If the pool is at its maximum limit, the acquire() call results in an error.

- `sessionFn` (Function): Allows running tasks in a single transaction. Commit/rollback (on error) operation executed after async task completed then releases the connection.    

`pool.acquire([sessionFn])`
    
- **Returns** : Promise<Connection>.

```js
pool.acquire().then(async (connection) => {
  try {
    const result = await connection.execute('any sql');
  } finally {
    connection.release();
  }      
});
```

```js
pool.acquire(async (connection) => {
  const result = await connection.execute('any sql');      
});
```

### Pool.prototype.execute()

This call acquires a connection, executes the query and releases connection immediately.

`pool.execute(query[, values[, options[, callback]]])`
            
- `query` (Query|String) : Query instance or sql string.
- `options` (Object) : Execute options.
  - `values` (Array|Object) : Array of values or object that contains param/value pairs.
  - `autoCommit` (Boolean=false) : If this property is true, the transaction committed at the end of query execution.
  - `cursor` (Boolean=false) : If this property is true, query returns a `Cursor` object that works in unidirectional "cursor" mode. **Important!** `Cursor` keeps connection open until `cursor.close()` method is called.
  - `fetchAsString` (Array`<Class>`) : This property is an array of Classes, determines which value types will represent as string. The valid classes are Date and Number.
  - `fetchRows` (Number) : In "cursor" mode; it provides an initial suggested number of rows to prefetch. Prefetching is a tuning option to maximize data transfer efficiency and minimize round-trips to the database.
In regular mode; it provides the maximum number of rows that are fetched from Connection instance.
  - `ignoreNulls` (Boolean=false) : Determines whether object rows contains NULL fields.
  - `naming` (Enum`<String>`) : Sets the naming rule for fields. It affects field names in object rows and metadata.
    - lowercase: Table/field names are lower case characters
    - uppercase: Table/field names are upper case characters
  - `objectRows` (Boolean=false) : Determines whether query rows should be returned as Objects or Arrays. This property applies to ResultSet.objectRows property also.
  - `showSql` (Boolean=false): If set true, result object contains executed sql and values.

- **Returns** : Returns Promise.

```js
pool.execute('any sql').then(result => {
  
});
``` 


### Pool.prototype.test()

This call tests the pool.

`pool.test()`

- **Returns** :  Returns Promise.

```js
pool.test().then(() => {
  console.log('Pool works');
}).catch((e) => console.log('Pool not working:', e));
``` 

### Pool.prototype.select()
Creates an executable [SelectQuery](query-builder/query/SelectQuery.md) associated with this pool.

`query = pool.select()`

### Pool.prototype.insert()
Creates an executable [InsertQuery](query-builder/query/InsertQuery.md) associated with this pool.

`query = pool.insert()`

### Pool.prototype.update()
Creates an executable [UpdateQuery](query-builder/query/UpdateQuery.md) associated with this pool.

`query = pool.update()`

### Pool.prototype.delete()
Creates an executable [DeleteQuery](query-builder/query/DeleteQuery.md) associated with this pool.

`query = pool.delete()`

### Pool.prototype.case()
Creates a [Case](query-builder/sql-object/Case.md) sql object.

### Pool.prototype.raw()
Creates a [Raw](query-builder/sql-object/Raw.md) sql object.

### Pool.prototype.join()
Creates an inner [Join](query-builder/sql-object/Join.md) sql object.

### Pool.prototype.innerJoin()
Creates an inner [Join](query-builder/sql-object/Join.md) sql object.

### Pool.prototype.leftJoin()
Creates an left [Join](query-builder/sql-object/Join.md) sql object.

### Pool.prototype.leftOuterJoin()
Creates an left outer [Join](query-builder/sql-object/Join.md) sql object.

### Pool.prototype.rightJoin()
Creates an right [Join](query-builder/sql-object/Join.md) sql object.

### Pool.prototype.rightJoin()
Creates an right [Join](query-builder/sql-object/Join.md) sql object.

### Pool.prototype.rightOuterJoin()
Creates an right outer [Join](query-builder/sql-object/Join.md) sql object.

### Pool.prototype.outerJoin()
Creates an outer [Join](query-builder/sql-object/Join.md) sql object.

### Pool.prototype.fullOuterJoin()
Creates an full outer [Join](query-builder/sql-object/Join.md) sql object.

<hr/>

## Events

### <a id="closeevent"></a>close

This event is called when `Pool` closed permanently.

```js
pool.on('close', () => {
    console.log('Pool shut down');
});
```

### <a id="executeevent"></a>execute

This event is called before executing a query. This is very useful for logging all database activity.

```js
pool.on('execute', (sql, values, options) => {
  logExecute(sql, values, options);
});
```
