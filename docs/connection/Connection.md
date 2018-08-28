# Connection class

## Index

#### Properties
- [isClosed](#isclosed)
- [pool](#pool)
- [referenceCount](#referencecount)
- [sessionId](#sessionid)
- [metaData](#metadata)

#### Methods
- [Connection.prototype.acquire()](#connectionprototypeacquire)
- [Connection.prototype.release()](#connectionprototyperelease)
- [Connection.prototype.execute()](#connectionprototypeexecute)
- [Connection.prototype.startTransaction()](#connectionprototypecommit)
- [Connection.prototype.commit()](#connectionprototypecommit)
- [Connection.prototype.rollback()](#connectionprototyperollback)
- [Connection.prototype.get()](#connectionprototypeget)

- [Connection.prototype.select()](#connectionprototypeselect)
- [Connection.prototype.insert()](#connectionprototypeinsert)
- [Connection.prototype.update()](#connectionprototypeupdate)
- [Connection.prototype.delete()](#connectionprototypedelete)
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

Connection object is created by Pool instance only when it needs a new one. `pool.acquire()` returns an available connection instance.

## Properties
    
### isClosed
*getter (Boolean)*

Returns true if connection is permanently closed, false otherwise.
    
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
function subOp1(connection) {
  connection.acquire();
  // do anything
  connection.release();
}

function subOp2(connection) {
  connection.acquire();
  // do anything
  connection.release();
}

const connection = await pool.acquire();
subOp1(connection);
subOp2(connection);
connection.release();

```
*In the example above, the connection will back to the pool after last sub operation finished.*
   

### Connection.prototype.release()
This method decreases the internal reference counter. When reference count is 0, connection returns to the pool.

`connection.release()`
  

### Connection.prototype.execute()
This method executes `Query` instances or raw sql statements.

`connection.execute(query[,options])`
            
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
const query = sqb.select('current_date').from('dual');
connection.execute(query).then(result => {
  console.log(result);
}).catch(error => {
  console.error(error);
});
```  

```js
connection.execute('any sql').then(result => {
  console.log(result);
}).catch(error => {
  console.error(error);
});
```  

### Connection.prototype.startTransaction()
This call starts a new transaction on the connection.

`connection.startTransaction()`

- **Returns** : Returns Promise.


### Connection.prototype.commit()
This call commits the current transaction in progress on the connection.

`connection.commit()`

- **Returns** : Returns Promise.


### Connection.prototype.rollback()
This call rolls back the current transaction in progress on the connection.

`connection.rollback()`

- **Returns** : Returns Promise.


### Connection.prototype.get()
This call returns values of properties that connection adapter exposes. 

`connection.get(property)`

- `property` (String) : Name of the property.

- **Returns**: Value of the property.

```js
connection.get('serverVersion');
```

### Connection.prototype.select()
Creates an executable [SelectQuery](query-builder/query/SelectQuery.md) associated with this pool.

`query = pool.select()`

### Connection.prototype.insert()
Creates an executable [InsertQuery](query-builder/query/InsertQuery.md) associated with this pool.

`query = pool.insert()`

### Connection.prototype.update()
Creates an executable [UpdateQuery](query-builder/query/UpdateQuery.md) associated with this pool.

`query = pool.update()`


### Connection.prototype.delete()
Creates an executable [DeleteQuery](query-builder/query/DeleteQuery.md) associated with this pool.

`query = pool.delete()`


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
connection.on('execute', (query, options) => {
    console.log('Executing', query, 'with options', options);
});
```
