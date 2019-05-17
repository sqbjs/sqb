# Conditional expressions

SQB provides two ways (Op functions, native js objects) for defining conditional expressions. Both can be used at same time.


## Index

SQB module exposes Op object that contains operator functions. This functions allows defining conditional expressions.

- [Op.and()](#opand): And logical operator
- [Op.or()](#opand): Or logical operator
- [Op.eq()](#opeq): `equal (=)` comparison operator
- [Op.ne()](#opne): `not equal (!=)` comparison operator
- [Op.gt()](#opgt): `greater than (>)` comparison operator
- [Op.gte()](#opgte): `greater than or equal to (>=)` comparison operator
- [Op.lt()](#oplt): `lower than (>)` comparison operator
- [Op.lte()](#oplte): `lower than or equal to (>=)` comparison operator
- [Op.between()](#opbetween): `between` comparison operator
- [Op.notBetween()](#opnotbetween): `not between` comparison operator
- [Op.is()](#opis): `is` comparison operator
- [Op.not()](#opnot): `is not` comparison operator
- [Op.like()](#oplike): `like` comparison operator
- [Op.notLike()](#opnotlike): `not like` comparison operator
- [Op.ilike()](#oplike): `ilike` comparison operator
- [Op.notILike()](#opnotilike): `not ilike` comparison operator
- [Op.exists()](#opexists): `not ilike` exists operator


<hr/>

## Operators

### Op.and()

`Op.and(...operators)`

Creates an `and` logical operator

```js
const sqb = require('sqb');
const Op = sqb.Op;
const query = sqb.select().from('customer')
    .where(Op.and(Op.eq('name', 'John'), Op.gte('age', 16)));
console.log(query.generate().sql);
```
```js
const sqb = require('sqb');
const Op = sqb.Op;
const query = sqb.select().from('customer')
    .where({and: {name: 'John', 'age >': 16}});
console.log(query.generate().sql);
```
```sql
select * from customer
where (name = 'John' and age >= 16)
```


### Op.or()

`Op.or(...operators)`

Creates an `or` logical operator

```js
const sqb = require('sqb');
const Op = sqb.Op;
const query = sqb.select().from('customer')
    .where(Op.or(
        Op.eq('name', 'John'), 
        Op.gte('age', 16)
        ));
console.log(query.generate().sql);
```
```js
const sqb = require('sqb');
const Op = sqb.Op;
const query = sqb.select().from('customer')
    .where({or: {
      name: 'John', 
      'age >': 16
    }});
console.log(query.generate().sql);
```

```sql
select * from customer
where (name = 'John' or age > 16)
```

## Comparison Operators

### Op.eq()

`Op.eq(expression, value)`

Creates an `equal (=)` comparison operator

```js
const sqb = require('sqb');
const Op = sqb.Op;
const query = sqb.select().from('customer')
    .where(
        Op.eq('name', 'John'), 
        Op.eq('age', 16)
        );
console.log(query.generate().sql);
```
```js
const sqb = require('sqb');
const Op = sqb.Op;
const query = sqb.select().from('customer')
    .where({
    name: 'John', 
    'age =': 16
    });
console.log(query.generate().sql);
```
```sql
select * from customer
where name = 'John' and age = 16
```


### Op.ne()

Creates an `not equal (!=)` comparison operator

`Op.ne(expression, value)`

```js
const sqb = require('sqb');
const Op = sqb.Op;
const query = sqb.select().from('customer')
    .where(Op.ne('age', 16));
console.log(query.generate().sql);
```
```js
const sqb = require('sqb');
const Op = sqb.Op;
const query = sqb.select().from('customer')
    .where({     
    'age !=': 16
    });
console.log(query.generate().sql);
```
```sql
select * from customer
where age != 16
```

### Op.gt()

Creates an `greater than (>)` comparison operator

`Op.gt(expression, value)`

```js
const sqb = require('sqb');
const Op = sqb.Op;
const query = sqb.select().from('customer')
    .where(Op.gt('age', 16));
console.log(query.generate().sql);
```
```js
const sqb = require('sqb');
const Op = sqb.Op;
const query = sqb.select().from('customer')
    .where({     
    'age >': 16
    });
console.log(query.generate().sql);
```
```sql
select * from customer
where age > 16
```

### Op.gte()

Creates an `greater than or equal to (>=)` comparison operator

`Op.gte(expression, value)`

```js
const sqb = require('sqb');
const Op = sqb.Op;
const query = sqb.select().from('customer')
    .where(Op.gte('age', 16));
console.log(query.generate().sql);
```
```js
const sqb = require('sqb');
const Op = sqb.Op;
const query = sqb.select().from('customer')
    .where({     
    'age >=': 16
    });
console.log(query.generate().sql);
```
```sql
select * from customer
where age >= 16
```

### Op.lt()

Creates an `lower than (>)` comparison operator

`Op.lt(expression, value)`

```js
const sqb = require('sqb');
const Op = sqb.Op;
const query = sqb.select().from('customer')
    .where(Op.lt('age', 16));
console.log(query.generate().sql);
```
```js
const sqb = require('sqb');
const Op = sqb.Op;
const query = sqb.select().from('customer')
    .where({     
    'age <': 16
    });
console.log(query.generate().sql);
```
```sql
select * from customer
where age < 16
```

### Op.lte()

Creates an `lower than or equal to (<=)` comparison operator

`Op.lte(expression, value)`

```js
const sqb = require('sqb');
const Op = sqb.Op;
const query = sqb.select().from('customer')
    .where(Op.lte('age', 16));
console.log(query.generate().sql);
```
```js
const sqb = require('sqb');
const Op = sqb.Op;
const query = sqb.select().from('customer')
    .where({     
    'age <=': 16
    });
console.log(query.generate().sql);
```
```sql
select * from customer
where age <= 16
```

### Op.between()

Creates an `between` comparison operator

`Op.between(expression, first, second)`

```js
const sqb = require('sqb');
const Op = sqb.Op;
const query = sqb.select().from('customer')
    .where(Op.or(
        Op.between('age', 18, 22),
        Op.between('age', 30, 32)
        ));
console.log(query.generate().sql);
```
```js
const sqb = require('sqb');
const Op = sqb.Op;
const query = sqb.select().from('customer')
    .where({or: {     
      'age between': [18,22],
      'age btw': [30,32],
    }});
console.log(query.generate().sql);
```
```sql
select * from customer
where (age between 18 and 22 or age between 30 and 32)
```

### Op.notBetween()

Creates an `not between` comparison operator

`Op.notBetween(expression, first, second)`
```js
const sqb = require('sqb');
const Op = sqb.Op;
const query = sqb.select().from('customer')
    .where(Op.or(
        Op.notBetween('age', 18, 22),
        Op.notBetween('age', 30, 32)
        ));
console.log(query.generate().sql);
```
```js
const sqb = require('sqb');
const Op = sqb.Op;
const query = sqb.select().from('customer')
    .where({or: {     
      'age !between': [18,22],
      'age !btw': [30,32],
    }});
console.log(query.generate().sql);
```
```sql
select * from customer
where (age not between 18 and 22 or age not between 30 and 32)
```

### Op.is()

Creates an `is` comparison operator

`Op.is(expression, value)`

```js
const sqb = require('sqb');
const Op = sqb.Op;
const query = sqb.select().from('customer')
    .where(Op.is('gender', null));
console.log(query.generate().sql);
```
```js
const sqb = require('sqb');
const Op = sqb.Op;
const query = sqb.select().from('customer')
    .where({     
      'gender is': null
    });
console.log(query.generate().sql);
```

```sql
select * from customer
where gender is null
```

### Op.not()

Creates an `is not` comparison operator

`Op.not(expression, value)`

```js
const sqb = require('sqb');
const Op = sqb.Op;
const query = sqb.select().from('customer')
    .where(Op.not('gender', null));
console.log(query.generate().sql);
```
```js
const sqb = require('sqb');
const Op = sqb.Op;
const query = sqb.select().from('customer')
    .where({     
      'gender !is': null
    });
console.log(query.generate().sql);
```

```sql
select * from customer
where gender is not null
```

### Op.like()

Creates an `like` comparison operator

`Op.like(expression, value)`

```js
const sqb = require('sqb');
const Op = sqb.Op;
const query = sqb.select().from('customer')
    .where(Op.like('name', '%John%'));
console.log(query.generate().sql);
```
```js
const sqb = require('sqb');
const Op = sqb.Op;
const query = sqb.select().from('customer')
    .where({     
      'name like': '%John%'
    });
console.log(query.generate().sql);
```
```sql
select * from customer
where name like '%John%'
```

### Op.notLike()

Creates an `not like` comparison operator

`Op.notLike(expression, value)`

```js
const sqb = require('sqb');
const Op = sqb.Op;
const query = sqb.select().from('customer')
    .where(Op.notLike('name', '%John%'));
console.log(query.generate().sql);
```
```js
const sqb = require('sqb');
const Op = sqb.Op;
const query = sqb.select().from('customer')
    .where({     
      'name !like': '%John%'
    });
console.log(query.generate().sql);
```
```sql
select * from customer
where name not like '%John%'
```

### Op.ilike()

Creates an `ilike` comparison operator

`Op.iLike(expression, value)`

```js
const sqb = require('sqb');
const Op = sqb.Op;
const query = sqb.select().from('customer')
    .where(Op.ilike('name', '%John%'));
console.log(query.generate().sql);
```
```js
const sqb = require('sqb');
const Op = sqb.Op;
const query = sqb.select().from('customer')
    .where({     
      'name ilike': '%John%'
    });
console.log(query.generate().sql);
```

```sql
select * from customer
where name ilike '%John%'
```

### Op.notILike()

Creates an `not ilike` comparison operator

`Op.notILike(expression, value)`

```js
const sqb = require('sqb');
const Op = sqb.Op;
const query = sqb.select().from('customer')
    .where(Op.notILike('name', '%John%'));
console.log(query.generate().sql);
```
```js
const sqb = require('sqb');
const Op = sqb.Op;
const query = sqb.select().from('customer')
    .where({     
      'name !ilike': '%John%'
    });
console.log(query.generate().sql);
```
```sql
select * from customer
where name not ilike '%John%'
```


### Op.exists()

Creates an `exists` operator

`Op.exists(SelectQuery)`

```js
const sqb = require('sqb');
const Op = sqb.Op;
const query = sqb.select().from('customer c')
    .where(Op.exists(
        sqb.select().from('customer_accounts a')
        .where(
            Op.eq('a.customer_id', sqb.raw('c.id')),
            Op.gt('a.balance', 0)
            )
        )
    );
console.log(query.generate().sql);
```
```js
const sqb = require('sqb');
const Op = sqb.Op;
const query = sqb.select().from('customer c')
    .where({exists:
              sqb.select().from('customer_accounts a')
                  .where(
                      Op.eq('a.customer_id', sqb.raw('c.id')),
                      Op.gt('a.balance', 0)
                  )
        }
    );
console.log(query.generate().sql);
```

### Op.notExists()

Creates an `exists` operator

`Op.notExists(SelectQuery)`

```js
const sqb = require('sqb');
const Op = sqb.Op;
const query = sqb.select().from('customer c')
    .where(Op.notExists(
        sqb.select().from('customer_accounts a')
        .where(
            Op.eq('a.customer_id', sqb.raw('c.id')),
            Op.gt('a.balance', 0)
            )
        )
    );
console.log(query.generate().sql);
```
```js
const sqb = require('sqb');
const Op = sqb.Op;
const query = sqb.select().from('customer c')
    .where({'!exists':
              sqb.select().from('customer_accounts a')
                  .where(
                      Op.eq('a.customer_id', sqb.raw('c.id')),
                      Op.gt('a.balance', 0)
                  )
        }
    );
console.log(query.generate().sql);
```

```sql
select * from customer c
where not exists (select * from customer_accounts a
  where a.customer_id = c.id and a.balance > 0)
```

