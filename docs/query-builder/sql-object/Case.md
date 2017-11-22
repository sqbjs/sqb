# Case Class

Sql object for adding `case/when` sql expressions.

## Index

#### Methods
- [Case.prototype.when()](#caseprototypewhen)
- [Case.prototype.then()](#caseprototypethen)
- [Case.prototype.else()](#caseprototypeelse)
- [Case.prototype.as()](#caseprototypeas)

<hr>

## Construction

SQB namespace exposes Case class. And also SQB namespace, [Pool](connection/Pool.md) and [Connection](connection/Connection.md) have `case()` function to create Case object.

`query = new sqb.Case()`

`query = (sqb|pool|connection).case()`

<hr>

## Methods

### Case.prototype.when() 
Defines "when" part of `Case` object.

`.when(..conditions)`

- `conditions`: [condition](query-builder/conditions.md) arrays.
- **Returns**: Case object itself.

### Case.prototype.then()
Defines "then" part of `Case` object.

`.then(value)`

- `value`: Value
- **Returns**: Case object itself.

### Case.prototype.else()
Defines "else" part of `Case` object.

`.else(value)`

- `value`: Value
- **Returns**: Case object itself.

```js
var query = sqb.select(
    sqb.case().when('age', '>=', 16).then(1).else(0)
).from('person');
```
```sql
Generated SQL for Postgres:
select
  case
    when age >= 16 then 1
    else 0
  end
from person
```

### Case.prototype.as()
Sets alias to case expression.

`.as(alias)`

- `alias`: Any alias string
- **Returns**: Case object itself.

```js
var query = sqb.select(
    sqb.case().when('age', '>=', 16).then(1).else(0).as('is_ok')
).from('person');
```
```sql
Generated SQL for Postgres:
select
  case
    when age >= 16 then 1
    else 0
  end is_ok
from person
```

