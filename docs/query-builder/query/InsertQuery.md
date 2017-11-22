#InsertQuery Class

## Index

### Methods
- [InsertQuery.prototype.into()](#deletequeryprototypeinto)
- [InsertQuery.prototype.values()](#deletequeryprototypevalues)
- [Query.prototype.execute()](#queryprototypeexecute)
- [Query.prototype.then()](#queryprototypethen)
- [Query.prototype.params()](#queryprototypeparams)
- [Query.prototype.where()](#queryprototypewhere)


<hr/>

## Construction

SQB namespace exposes InsertQuery class. And also SQB namespace, [Pool](connection/Pool.md) and [Connection](connection/Connection.md) have `insert()` function that creates SelectQuery instance.

A Query instance that created by [Pool](connection/Pool.md) and [Connection](connection/Connection.md) can be executed directly.


`query = new sqb.InsertQuery()`

`query = (sqb|pool|connection).insert()`


#### Alternative-1

`query = sqb.insert(...column)`

- `column` (String) : String representation of column name.

```js
var query = sqb.insert('id', 'name')
    .into('customer')
    .values({id: 1, name: 'John'});
```

```sql
Generated SQL for Postgres:
insert into customer (id, name) values (1, 'John')
```


#### Alternative-2

`query = sqb.insert(valuesObj)`

- `valuesObj` (Object) : Object that contains column/value pairs.

```js
query = sqb.insert({id: 1, name: 'John'})
    .into('customer');
```
```sql
Generated SQL for Postgres:
insert into customer (id, name) values (1, 'John')
```


<hr/>

## Methods

### InsertQuery.prototype.into() 
Defines "into" part of delete query.

`.into(tableName)`

- `tableName` (String|Raw) : String representation of table name or Raw sql object.
- **Returns**: InsertQuery itself.

```js
const query = sqb.insert(...).into('customer');
```
  
### InsertQuery.prototype.values() 
Defines "values" part of insert query.

#### Alternative-1

`.values(valueArray)`

- `valueArray` : Array of values with column order
- **Returns**: InsertQuery itself.

```js
const query = sqb.insert('id', 'name')
    .into('customer')
    .values([1, 'John']);
```
```sql
Generated SQL for Postgres:
insert into customer (id, name) values (1, 'John')
```


#### Alternative-2

`.values(valueObject)`

- `valueObject` Object that contains column/value pairs.
- **Returns**: InsertQuery itself.

```js
const query = sqb.insert('id', 'name')
    .into('customer')
    .values({id: 1, name: 'John'});
```
```sql
Generated SQL for Postgres:
insert into customer (id, name) values (1, 'John')
```

#### Alternative-3

`.values(selectQuery)`

- `selectQuery` Instance of a SelectQuery.
- **Returns**: InsertQuery itself.

```js
var query = sqb.insert('id', 'name')
    .into('customer')
    .values(
        sqb.select('id', 'name')
            .from('Person')
            .where(['age', '>', 25]));
```
```sql
Generated SQL for Postgres:
insert into customer (id, name)
select id, name from Person where age > 25
```

#### Alternative-4

`.values(raw)`

- `raw`: Raw sql object.
- **Returns**: InsertQuery itself.

```js
var query = sqb.insert('id', 'name')
    .into('customer')
    .values(sqb.raw("\nvalues (1, 'John')"));
```
```sql
Generated SQL for Postgres:
insert into customer (id, name) 
values (1, 'John')
```


### Query.prototype.execute() 
Executes query. Please check [executing queries](query-builder/executingqueries.md) section for details.

```js
pool.insert({id: 1, name: 'John'})
    .into('customer')
    .execute({
       autoCommit: true
     }, function(err, result) {
       if (err)
         return console.error(err);
       console.log('Record inserted');
     };
```

### Query.prototype.params() 
Sets execution params for query. Please check [executing queries](query-builder/executingqueries.md) section for details.

```js
const query = pool.insert({id: /ID/, name: /Name/});
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
const promise = pool.insert({id: 1, name: 'John'})
    .into('customer')
    .then({
       autoCommit: true
     }, result => {
       console.log('Record inserted');
     ). catch(err => {
       console.error(err);
     );
```
