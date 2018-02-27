#SelectQuery Class

## Index

### Methods
- [SelectQuery.prototype.as()](#selectqueryprototypeas)
- [SelectQuery.prototype.columns()](#selectqueryprototypecolumns)
- [SelectQuery.prototype.from()](#selectqueryprototypefrom)
- [SelectQuery.prototype.groupBy()](#selectqueryprototypegroupby)
- [SelectQuery.prototype.join()](#selectqueryprototypejoin)
- [SelectQuery.prototype.limit()](#selectqueryprototypelimit)
- [SelectQuery.prototype.offset()](#selectqueryprototypeoffset)
- [SelectQuery.prototype.orderBy()](#selectqueryprototypeorderby)
- [SelectQuery.prototype.where()](#selectqueryprototypewhere)
- [Query.prototype.execute()](#queryprototypeexecute)
- [Query.prototype.params()](#queryprototypeparams)
- [Query.prototype.then()](#queryprototypethen)

### Events
- [fetch](#fetchevent)

<hr/>

## Construction

SQB namespace, [Pool](connection/Pool.md) and [Connection](connection/Connection.md) have `select()` function that creates SelectQuery instance.

A Query instance that created by [Pool](connection/Pool.md) and [Connection](connection/Connection.md) can be executed directly.

`query = (sqb|pool|connection).select(..column)`


If any argument passed to constructor, columns() method is called with given arguments.

<hr/>

## Methods

### SelectQuery.prototype.as() 
Sets alias for sub-select queries

`.as(alias)`

- `alias` (String) : Alias for query.

- **Returns**: SelectQuery itself.

```js
var query = sqb.select('p.id')
    .from(sqb.select().from('person').as('p'));
```
```sql
Generated SQL for Postgres:
select p.id from (select * from person) p
```


### SelectQuery.prototype.columns() 
Defines "columns" part of select query.

#### Alternative-1

`.columns(...column)`

- `column` : String representation of column name

    **Format:**
    
    [(tableName|tableAlias).] fieldname [as] [columnAlias]

    ```js
    .select(
      'field1',            
      'field2 as f1',      
      'field3 f1',  
      'table1.field4',     
      't1.field5',    
      't1.field6 f6'
    ).from('table1 t1')
```


- **Returns**: SelectQuery itself.



```js
var query = sqb.select('c.id', 'c.name customer_name').from('customer c');
```
```sql
Generated SQL for Postgres:
select c.id, c.name customer_name from customer c
```

#### Alternative-2

`.columns(...selectQuery)`

- `selectQuery` : Instance of a SelectQuery.
- **Returns**: SelectQuery itself.

```js
var query = sqb.select('c.id',
    sqb.select('name').from('person').where(Op.eq('id', 1)).as('persone_name')
).from('customer c');
```
```sql
Generated SQL for Postgres:
select c.id, (select name from person where id = 1) persone_name from customer c

```

#### Alternative-3

`.columns(...raw)`

- `raw` : Raw sql object.
- **Returns**: SelectQuery itself.

```js
var query = sqb.select('id', sqb.raw('anyfunc()')).from('customer');
   
```
```sql
Generated SQL for Postgres:
select id, anyfunc() from customer
```


### SelectQuery.prototype.from() 
Defines "from" part of select query.

#### Alternative-1

`.from(...tableName)`

- `tableName` : String representation of table name.
- **Returns**: SelectQuery itself.

```js
var query = sqb.select('c.*').from('customer c');
```
```sql
Generated SQL for Postgres:
select c.* from customer c
```

#### Alternative-2

`.from(...selectSql)`

- `selectSql` : Instance of a SelectQuery.
- **Returns**: SelectQuery itself.

```js
var query = sqb.select('t1.id', 't1.name').from(
    sqb.select().from('person').as('t1')
);
```
```sql
Generated SQL for Postgres:
select t1.id, t1.name from (select * from person) t1
```

#### Alternative-3

`.from(...raw)`

- `raw` : Raw sql object.
- **Returns**: SelectQuery itself.

```js
var query = sqb.select('id', 'name').from(
    sqb.raw('anyproc()')
);
```
```sql
Generated SQL for Postgres:
select id, name from anyproc()
```

### SelectQuery.prototype.groupBy() 
Defines "group by" part of `query`.

`.groupBy(...column)`

- `column` (String|Raw) : String representation of column name or Raw sql.

- **Returns**: SelectQuery itself.

```js
var query = sqb.select('c.name')
    .from('customer c')
    .groupBy('age');
```
```sql
Generated SQL for Postgres:
select c.name from customer c
group by age
```


### SelectQuery.prototype.join() 
Adds "join" statements to `query`.

`.join(..join)`

- `join` (Join): Instance of [Join](Join.md) class
- **Returns**: SelectQuery itself.

**Example**

```js
var query = sqb.select('c.*')
    .from('customer c')
    .join(sqb.join('person p').on(['p.id', sqb.raw('c.person_id')]));
```
```sql
Generated SQL for Postgres:
select c.* from customer c
inner join person p on p.id = c.person_id
```
    
### SelectQuery.prototype.limit() 
Sets limit for `query`.

`.limit(value)`

- `value` (Number) : Value for limit

- **Returns**: SelectQuery itself.

```js
var query = pool.select().from('customer').limit(10);
```
```sql
Generated SQL for Postgres:
select * from customer
LIMIT 10
```
```sql
Generated SQL for Oracle 11g:
select * from (
  select * from customer
) where rownum <= 10
```
```sql
Generated SQL for Oracle 12c:
select * from customer
FETCH FIRST 10 ROWS ONLY
```


### SelectQuery.prototype.offset() 
Sets offset for `query`.

`.offset(value)`

- `value` (Number) : Value for offset

- **Returns**: SelectQuery itself.

```js
var query = pool.select().from('customer').offset(25).limit(10);
```
```sql
Generated SQL for Postgres:
select * from customer
LIMIT 10 OFFSET 25
```
```sql
Generated SQL for Oracle 11g:
select * from (
  select /*+ first_rows(10) */ t.*, rownum row$number from (
    select * from customer
  ) t where rownum <= 35
) where row$number >= 26
```
```sql
Generated SQL for Oracle 12c:
select * from customer
OFFSET 25 ROWS FETCH NEXT 10 ROWS ONLY
```

### SelectQuery.prototype.orderBy() 
Defines "order by" part of `query`.

`.orderBy(...column)`

- `column` (String|Raw) : String representation of column name or Raw sql.
    **Format:**    
        [+|-] [(tablename|alias).] fieldname [asc|ascending|dsc|descending]

    ```js
.orderBy(
    "field1",            // field1 ascending
    "field1 asc",        // field1 ascending
    "field1 ascending",  // field1 ascending
    "+field1",           // field1 ascending
      
    "field1 desc",       // field1 descending
    "field1 descending", // field1 descending
    "-field1",           // field1 descending
        
      "table2.field2",     // table2.field2 ascending
      "-table2.field2",    // table2.field2 descending
)
  ```
- **Returns**: SelectQuery itself.


**Example **
```js
var query = sqb.select('id', 'name')
    .from('customer')
    .orderBy('f1', '-f2', 'f3 desc', 'f4 descending');
```
```sql
Generated SQL for Postgres:
select id, name from customer
order by f1, f2 desc, f3 desc, f4 desc
```


### SelectQuery.prototype.where() 
Defines "where" part of `query`.

`.where(..conditions)`

- `conditions`: [condition](query-builder/operators.md) arrays.
- **Returns**: UpdateQuery itself.


```js
const query = sqb.delete('customer')
    .where(Op.like('name', '%john%'));
```



### Query.prototype.execute() 
Executes query. Please check [executing queries](connection/executing-queries.md) section for details.

```js
pool.select()
    .from('customer')
    .where(Op.like('name', '%john%'))
    .execute({
       autoCommit: true
     }, function(err, result) {
       if (err)
         return console.error(err);
       console.log(result.rowset.length, ' rows fetched');
     };
```

### Query.prototype.params() 
Sets execution params for query. Please check [executing queries](connection/executing-queries.md) section for details.

```js
const query = pool.select()
    .from('customer')
    .where(Op.like('name', /Name/))

....    
query.params({Name: request.params.Name)    
    .execute({
       autoCommit: true
     }, function(err, result) {
       if (err)
         return console.error(err);
       console.log(result.rowset.length, ' rows fetched');
     };
```


### Query.prototype.then() 
Executes query and returns Promise. Please check [executing queries](connection/executing-queries.md) section for details.

```js
const promise = pool.select()
    .from('customer')
    .where(Op.like('name', '%john%'))
    .then({
       autoCommit: true
     }, result => {
       console.log(result.rowset.length, ' rows fetched');
     ). catch(err => {
       console.error(err);
     );
```

## Events

### <a id="fetchevent"></a>fetch 
This event will be called whenever a row fetched from database. This is useful when row values need to be modified before caching by Cursor, or etc.

```js
pool.select().from('table1')
    .on('fetch', function(row) {
      row.CalcField = row.price * row.quantity;
    })
    .execute({
      objectRows: true
    }, function(err, result) {
      .....
    });
})
```


