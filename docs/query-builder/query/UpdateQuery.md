#UpdateQuery Class

## Index

### Methods
- [UpdateQuery.prototype.where()](#updatequeryprototypewhere)
- [UpdateQuery.prototype.returning()](#updatequeryprototypereturning)
- [Query.prototype.execute()](#queryprototypeexecute)
- [Query.prototype.values()](#queryprototypevalues)

<hr/>

## Construction

SQB namespace, [Pool](connection/Pool.md) and [Connection](connection/Connection.md) have `update()` function that creates SelectQuery instance.

A Query instance that created by [Pool](connection/Pool.md) and [Connection](connection/Connection.md) can be executed directly.

`query = (sqb|pool|connection).update(tableName)`


- `tableName` (String|Raw) : String representation of table name or Raw sql object.
- `values`: Object that contains column/value pairs.

```js
var query = sqb.update('customer', {name:'John'})
```

```sql
Generated SQL for Postgres:
update customer set name = 'John'
```

<hr/>

## Methods

### UpdateQuery.prototype.where() 
Defines "where" part of `query`.

`.where(..conditions)`

- `conditions`: [condition](query-builder/operators.md) arrays.
- **Returns**: UpdateQuery itself.

```js
var query = sqb.update('customer', {name:'John'})
    .where(['id', 1]);
```
```sql
Generated SQL for Postgres:
update customer set
  name = 'John'
where id = 1
```

### ReturningQuery.prototype.returning() 
Defines "returning" part of `query`.

`.returning(obj)`

- `obj` (Object): An object instance that defines returning parameters
.
- **Returns**: UpdateQuery itself.

```js
var query = sqb.update('customer', {name:'John'})
    .where({'id': 1}).returning({
      id: 'number',
      name: 'string'
    });
```
```sql
Generated SQL for Oracle:
update customer set
  name = 'John'
where id = 1
returning id into :returning$id, name into :returning$name
```


### Query.prototype.execute()
Executes query and returns Promise. Please check [executing queries](connection/executing-queries.md) section for details.

```js
pool.update('customer', {name: 'John'})
    .where({'id': 1})
    .execute({
      autoCommit: true
    }).then(result => {
      console.log('Record updated');
    });
```

### Query.prototype.values() 
Sets execution values for query. Please check [executing queries](connection/executing-queries.md) section for details.

```js
const query = pool.pool.update('customer', {name: /Name/})    
    .where({'id': /ID/});
....    
query.values({ID: request.values.ID, Name: request.values.Name)    
    .execute({
       autoCommit: true
     }).then(result => {
       console.log('Records inserted');
     });
```
