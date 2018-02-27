#DeleteQuery Class

## Index

#### Methods
- [DeleteQuery.prototype.from()](#deletequeryprototypefrom)
- [DeleteQuery.prototype.where()](#deletequeryprototypewhere)
- [Query.prototype.execute()](#queryprototypeexecute)
- [Query.prototype.params()](#queryprototypeparams)
- [Query.prototype.then()](#queryprototypethen)

<hr/>


## Construction

SQB namespace, [Pool](connection/Pool.md) and [Connection](connection/Connection.md) have `delete()` function that creates SelectQuery instance.

A Query instance that created by [Pool](connection/Pool.md) and [Connection](connection/Connection.md) can be executed directly.

`query = (sqb|pool|connection).delete([tableName])`


- `tableName` (String|Raw) : String representation of table name or Raw sql object.

```js
var query = sqb.delete('customer')
    .where(Op.eq('id', 1));
```
```sql
Generated SQL for Postgres:
delete from customer where id = 1
```

<hr/>

## Methods

### DeleteQuery.prototype.from() 
Defines "from" part of delete query.

`.from(tableName)`

- `tableName` (String|Raw) : String representation of table name or Raw sql object.
- **Returns**: DeleteQuery itself.


```js
const query = sqb.delete().from('customer');
```
```sql
Generated SQL for Postgres:
delete from customer
```


### DeleteQuery.prototype.where() 
Defines "where" part of `query`.

`.where(..conditions)`

- `conditions`: [condition](query-builder/operators.md) arrays.
- **Returns**: UpdateQuery itself.

```js
const query = sqb.delete('customer')
    .where(Op.like('name', '%john%'));
```
```sql
Generated SQL for Postgres:
delete from customer where name like '%john%'
```

### Query.prototype.execute() 
Executes query. Please check [executing queries](connection/executing-queries.md) section for details.

```js
pool.delete('customer')
    .where(Op.like('name', '%john%'))
    .execute({
       autoCommit: true
     }, function(err, result) {
       if (err)
         return console.error(err);
       console.log('Records deleted');
     };
```

### Query.prototype.params() 
Sets execution params for query. Please check [executing queries](connection/executing-queries.md) section for details.

```js
const query = pool.delete('customer')
    .where(Op.eq('id', /Id/));
....    
query.params({ID: request.params.ID)    
    .execute({
       autoCommit: true
     }, function(err, result) {
       if (err)
         return console.error(err);
       console.log('Records deleted');
     };
```



### Query.prototype.then() 
Executes query and returns Promise. Please check [executing queries](connection/executing-queries.md) section for details.

```js
const promise = pool.delete('customer')
    .where(Op.like('name', '%john%'))
    .then({
       autoCommit: true
     }, result => {
       console.log('Records deleted');
     ). catch(err => {
       console.error(err);
     );
```


