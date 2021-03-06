#InsertQuery Class

## Index

### Methods
- [Query.prototype.execute()](#queryprototypeexecute)
- [Query.prototype.values()](#queryprototypevalues)


<hr/>

## Construction

SQB namespace, [Pool](connection/Pool.md) and [Connection](connection/Connection.md) have `insert()` function that creates SelectQuery instance.

A Query instance that created by [Pool](connection/Pool.md) and [Connection](connection/Connection.md) can be executed directly.

`query = (sqb|pool|connection).insert(tableName, values)`

- `tableName` (String|Raw) : String representation of table name or Raw sql object.

- `values` : Array of values with column order


```js
query = sqb.insert('customer', {id: 1, name: 'John'});
```
```sql
Generated SQL for Postgres:
insert into customer (id, name) values (1, 'John')
```


<hr/>

## Methods


### ReturningQuery.prototype.returning() 
Defines "returning" part of `query`.

`.returning(obj)`

- `obj` (Object): An object instance that defines returning parameters
.
- **Returns**: UpdateQuery itself.

```js
var query = sqb.insert('customer', {name:'John'})
    .returning({
      id: 'number',
      name: 'string'
    });

```
```sql
Generated SQL for Oracle:
insert into customer (name) value ('John')
returning id into :returning$id, name into :returning$name
```

### Query.prototype.execute() 
Executes query and returns Promise. Please check [executing queries](connection/executing-queries.md) section for details.

```js
pool.insert('customer', {id: 1, name: 'John'})    
    .execute({
       autoCommit: true
     }).then(result => {
       console.log('Record inserted');
     });
```

### Query.prototype.values() 
Sets execution values for query. Please check [executing queries](connection/executing-queries.md) section for details.

```js
const query = pool.insert('customer', {id: /ID/, name: /Name/});
....    
query.values({ID: request.values.ID, Name: request.values.Name)    
    .execute({
       autoCommit: true
     }).then(result => {
       console.log('Records inserted');
     });
```