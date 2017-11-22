# Connection class

## Index

#### Properties
- [isClosed](#isclosed)
- [metaData](#metadata)
- [pool](#pool)
- [referenceCount](#referencecount)
- [sessionId](#sessionid)

#### Methods
- [Connection.prototype.acquire()](#connectionprototypeacquire)
- [Connection.prototype.commit()](#connectionprototypecommit)
- [Connection.prototype.execute()](#connectionprototypeexecute)
- [Connection.prototype.get()](#connectionprototypeget)
- [Connection.prototype.release()](#connectionprototyperelease)
- [Connection.prototype.rollback()](#connectionprototyperollback)
- [Connection.prototype.delete()](#connectionprototypedelete)
- [Connection.prototype.insert()](#connectionprototypeinsert)
- [Connection.prototype.update()](#connectionprototypeupdate)
- [Connection.prototype.select()](#connectionprototypeselect)
- [Connection.prototype.start()](#connectionprototypestart)
- [Connection.prototype.close()](#connectionprototypeclose)
- [Connection.prototype.case()](#connectionprototypecase)
- [Connection.prototype.raw()](#connectionprototyperaw)
- [Connection.prototype.join()](#connectionprototypejoin)
- [Connection.prototype.innerJoin()](#connectionprototypeinnerjoin)
- [Connection.prototype.leftJoin()](#connectionprototypeleftjoin)
- [Connection.prototype.leftOuterJoin()](#connectionprototypeleftouterjoin)
- [Connection.prototype.rightJoin()](#connectionprototyperightjoin)
- [Connection.prototype.rightOuterJoin()](#connectionprototyperightouterjoin)
- [Connection.prototype.outerJoin()](#connectionprototypeouterjoin)
- [Connection.prototype.fullOuterJoin()](#connectionprototypefullouterjoin)

#### Events
- [close](#closeevent)
- [commit](#commitevent)
- [rollback](#rollbackevent)
- [execute](#executeevent)

<hr/>

## Construction

Connection object is created by Pool instance only when it needs a new one. `pool.connect()` returns an available connection instance.

## Properties
    
### isClosed
*getter (Boolean)*

Returns true if connection is permanently closed, false otherwise.
    
### metaData
*getter (`MetaData`)*

Returns instance of `MetaData` instance which helps working with database meta-data.

### pool
*getter ([Pool](connection/Pool.md))* 

Returns `Pool` instance that this connection owned by.

### referenceCount
*getter (Number)* 

Returns internal reference counter number.

### sessionId
*getter (String|Number)*

Returns session id of the connection given by database server.


<hr/>

## Methods

### Connection.prototype.acquire()

This method increases internal reference counter of connection instance. `connection.release()` decreases the counter. The reference counter starts with 1 when connection obtained from the pool. The connection keeps open till reference counter is greater than zero. It is very useful when the connection needs to be used in many sub operations. You don't have to care about which one ends last.

`connection.acquire()`
      
```js
function asyncFunction1(connection) {
  connection.acquire();
  // do anything
  connection.release();
}

function asyncFunction2(connection) {
  connection.acquire();
  // do anything
  connection.release();
}

pool.connect((error, connection) => {
  asyncFunction1(connection);
  asyncFunction2(connection);
  connection.release();
});
```
*In the example above, the connection will back to the pool after last sub operation finished.*
   
   
### Connection.prototype.commit()
This call commits the current transaction in progress on the connection.

`connection.commit([callback])`

- `callback` (Function) : Function, taking one argument:

  `function(error)`  
  - `error` (`Error`): Error object, if method fails. Undefined otherwise.


### Connection.prototype.execute()
This method executes `Query` instances or sql statement strings.

`connection.execute(query[, values[, options[, callback]]])`
            
- `query` (Query|String) : Query instance or sql string.
- `values` (Array|Object) : Array of values or object that contains param/value pairs.
- `options` (Object) : Execute options.
  - `autoCommit` (Boolean=false) : If this property is true, the transaction committed at the end of query execution.
  - `cursor` (Boolean=false) : If this property is true, query returns a `Cursor` object that works in unidirectional "cursor" mode. Otherwise it returns [Rowset](connection/Rowset.md) which fetches exact number of rows. **Important!** `Cursor` keeps connection open until `cursor.close()` method is called.
  - `fetchAsString` (Array`<Class>`) : This property is an array of Classes, determines which value types will represent as string. The valid classes are Date and Number.
  - `fetchRows` (Number) : In "cursor" mode; it provides an initial suggested number of rows to prefetch. Prefetching is a tuning option to maximize data transfer efficiency and minimize round-trips to the database.
In Rowset mode; it provides the maximum number of rows that are fetched from Connection instance.
  - `ignoreNulls` (Boolean=false) : Determines whether object rows contains NULL fields.
  - `naming` (Enum`<String>`) : Sets the naming rule for fields. It affects field names in object rows and metadata.
    - lowercase: Table/field names are lower case characters
    - uppercase: Table/field names are upper case characters
  - `objectRows` (Boolean=false) : Determines whether query rows should be returned as Objects or Arrays. This property applies to ResultSet.objectRows property also.
  - `showSql` (Boolean=false): If set true, result object contains executed sql and values.
- `callback` (Function) : Function, taking one argument:

  `function(error)`  
  - `error` (`Error`): Error object, if method fails. Undefined otherwise.



- **Returns** : If method is invoked with a callback, it returns a Undefined. Otherwise it returns Promise.

```js
connection.execute('any sql', (err, result) => {
  if (err)
    return console.error(err);
  .....
});
``` 
```js
connection.execute('any sql').then((result) => {
  ....
}).catch(error => {
  console.error(error);
});
```  

- **Returns** : If method is invoked with a callback, it returns a Undefined. Otherwise it returns Promise.

### Connection.prototype.get()
This call returns values of properties that connection drivers exposes. 

`connection.get(property)`

- `property` (String) : Name of the property.
- **Returns**: Value of the property.

```js
connection.get('serverVersion');
```

- `callback` (Function) : Function, taking one argument:

  `function(error)`  
  - `error` (`Error`): Error object, if method fails. Undefined otherwise.


- **Returns** : Value.


### Connection.prototype.release()
This method decreases the internal reference counter. When reference count is 0, connection returns to the pool.

`connection.release()`


### Connection.prototype.rollback()
This call rolls back the current transaction in progress on the connection.

`connection.rollback([callback])`

- `callback` (Function) : Function, taking one argument:

  `function(error)`  
  - `error` (`Error`): Error object, if method fails. Undefined otherwise.


- **Returns** : If method is invoked with a callback, it returns a Undefined. Otherwise it returns Promise.


### Connection.prototype.delete()
Creates an executable [DeleteQuery](query-builder/query/DeleteQuery.md) associated with this pool.

`query = pool.delete()`

### Connection.prototype.insert()
Creates an executable [InsertQuery](query-builder/query/InsertQuery.md) associated with this pool.

`query = pool.insert()`

### Connection.prototype.update()
Creates an executable [UpdateQuery](query-builder/query/UpdateQuery.md) associated with this pool.

`query = pool.update()`

### Connection.prototype.select()
Creates an executable [SelectQuery](query-builder/query/SelectQuery.md) associated with this pool.

`query = pool.select()`

### Connection.prototype.case()
Creates a [Case](query-builder/sql-object/Case.md) sql object.

### Connection.prototype.raw()
Creates a [Raw](query-builder/sql-object/Raw.md) sql object.

### Connection.prototype.join()
Creates an inner [Join](query-builder/sql-object/Join.md) sql object.

### Connection.prototype.innerJoin()
Creates an inner [Join](query-builder/sql-object/Join.md) sql object.

### Connection.prototype.leftJoin()
Creates an left [Join](query-builder/sql-object/Join.md) sql object.

### Connection.prototype.leftOuterJoin()
Creates an left outer [Join](query-builder/sql-object/Join.md) sql object.

### Connection.prototype.rightJoin()
Creates an right [Join](query-builder/sql-object/Join.md) sql object.

### Connection.prototype.rightJoin()
Creates an right [Join](query-builder/sql-object/Join.md) sql object.

### Connection.prototype.rightOuterJoin()
Creates an right outer [Join](query-builder/sql-object/Join.md) sql object.

### Connection.prototype.outerJoin()
Creates an outer [Join](query-builder/sql-object/Join.md) sql object.

### Connection.prototype.fullOuterJoin()
Creates an full outer [Join](query-builder/sql-object/Join.md) sql object.

<hr/>

## Events

### <a id="closeevent"></a>close

This event is called when `Connection` returned to the pool.

```js
connection.on('close', () => {
    console.log('Connection closed');
});
```

### <a id="commitevent"></a>commit

This event is called when commit success.

```js
connection.on('commit', () => {
    console.log('Connection commit');
});
```

### <a id="rollbackevent"></a>rollback

This event is called when rollback success.

```js
connection.on('rollback', () => {
    console.log('Connection rollback');
});
```

### <a id="executeevent"></a>execute

This event is called before executing a query.

```js
connection.on('execute', (options) => {
    console.log('Executing with options:', options);
});
```




