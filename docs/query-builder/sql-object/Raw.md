# Raw Class

<hr>

## Construction

SQB namespace exposes Raw class. And also SQB namespace, [Pool](connection/Pool.md) and [Connection](connection/Connection.md)  have `raw()` function that creates Raw object.

`query = new sqb.Raw(str)`

`query = (sqb|pool|connection).raw(str)`

```js
var query = sqb.select('id', sqb.raw('anyfunc()')).from('customer');  
```
```sql
Generated SQL for Postgres:
select id, anyfunc() from customer
```
