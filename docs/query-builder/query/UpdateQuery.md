#UpdateQuery Class

## Index

### Methods
- [UpdateQuery.prototype.set()](#updatequeryprototypeset)
- [UpdateQuery.prototype.where()](#updatequeryprototypewhere)
- [Query.prototype.execute()](#queryprototypeexecute)
- [Query.prototype.params()](#queryprototypeparams)
- [Query.prototype.then()](#queryprototypethen)

<hr/>

## Construction

SQB namespace exposes UpdateQuery class. And also SQB namespace, [Pool](connection/Pool.md) and [Connection](connection/Connection.md) have `update()` function that creates SelectQuery instance.

A Query instance that created by [Pool](connection/Pool.md) and [Connection](connection/Connection.md) can be executed directly.


`query = new sqb.UpdateQuery(tableName)`

`query = (sqb|pool|connection).update(tableName)`


- `tableName` (String|Raw) : String representation of table name or Raw sql object.

```js
var query = sqb.update('customer')
```

<hr/>

## Methods

### UpdateQuery.prototype.set()
Sets update fields and values of `query`.

`.set(valueObject)`

- `valueObject`: Object that contains column/value pairs.

- **Returns**: UpdateQuery itself.

```js
var query = sqb.update('customer')
    .set({name:'John'});
```
```sql
Generated SQL for Postgres:
update customer set
  name = 'John'
```

### UpdateQuery.prototype.where() 
Defines "where" part of `query`.

`.where(..conditions)`

- `conditions`: [condition](query-builder/conditions.md) arrays.
- **Returns**: UpdateQuery itself.

```js
var query = sqb.update('customer')
    .set({name:'John'})
    .where(['id', 1]);
```
```sql
Generated SQL for Postgres:
update customer set
  name = 'John'
where id = 1
```

### Query.prototype.execute()
Executes query. Please check [executing queries](query-builder/executingqueries.md) section for details.

```js
pool.update('customer')
    .set({name: 'John'})
    .where(['id', 1])
    .execute({
      autoCommit: true
    }, function(err, result) {
      if (err)
        return console.error(err);
      console.log('Record updated');
    });
```

### Query.prototype.params() 
Sets execution params for query. Please check [executing queries](query-builder/executingqueries.md) section for details.

```js
const query = pool.pool.update('customer')
    .set({name: //Name})
    .where(['id', /ID/])
....    
query.params({ID: request.params.ID, Name: request.params.Name)    
    .execute({
       autoCommit: true
     }, function(err, result) {
       if (err)
         return console.error(err);
       console.log('Records inserted');
     };
```



### Query.prototype.then()
Executes query and returns Promise. Please check [executing queries](query-builder/executingqueries.md) section for details.

```js
var promise = pool.update('customer')
    .set({name: 'John'})
    .where(['id', 1])
    .then({
      autoCommit: true
    }, result => {
      console.log('Record updated');
    ). catch(err => {
      console.error(err);
    );
```
