# Join Class

Sql object for adding `join` expressions.

## Index

#### Methods

- [Join.prototype.on()](#joinprototypeon)

<hr>

## Construction

SQB namespace, [Pool](connection/Pool.md) and [Connection](connection/Connection.md) have 8 methods to create Join object.

`query = (sqb|pool|connection).join(tableName)`

`query = (sqb|pool|connection).innerJoin(tableName)`

`query = (sqb|pool|connection).leftJoin(tableName)`

`query = (sqb|pool|connection).leftOuterJoin(tableName)`

`query = (sqb|pool|connection).rightJoin(tableName)`

`query = (sqb|pool|connection).rightOuterJoin(tableName)`

`query = (sqb|pool|connection).outerJoin(tableName)`

`query = (sqb|pool|connection).fullOuterJoin(tableName)`

<hr>

## Methods

### UpdateQuery.prototype.on() 
Defines "on" part of `join`.

`.where(..conditions)`

- `conditions`: [condition](query-builder/operators.md) arrays.
- **Returns**: UpdateQuery itself.


```js
var query = sqb.select('c.*')
    .from('customer c')
    .join(
        sqb.innerJoin('person p').on(Op.eq('p.id', sqb.raw('c.person_id'))),
        sqb.leftOuterJoin('contact cn').on(Op.eq('cn.id', sqb.raw('c.contact_id')))
    );
```
```sql
Generated SQL for Postgres:
select c.* from customer c
inner join person p on p.id = c.person_id
left outer join contact cn on cn.id = c.contact_id
```
