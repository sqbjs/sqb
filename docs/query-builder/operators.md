# Conditional expressions

SQB provides two ways (Op functions, native js objects) for defining conditional expressions. Both can be used at same time.


## Index

#### A. Op. functions

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


#### B. Native JS objects

- [Using native JS objects](#usingnativejsobjects)

<hr/>

## A. Op. functions

### Op.and()

`Op.and(...operators)`

Creates an `and` logical operator

```js
const query = sqb.select().from('customer')
    .where(Op.and(Op.eq('name', 'John'), Op.gte('age', 16)));
```
```sql
select * from customer
where (name = 'John' and age >= 16)
```


### Op.or()

`Op.or(...operators)`

Creates an `or` logical operator

```js
const query = sqb.select().from('customer')
    .where(Op.or(Op.eq('name', 'John'), Op.gte('age', 16)));
```
```sql
select * from customer
where (name = 'John' or age >= 16)
```

## Comparison Operators

### Op.eq()

`Op.eq(expression, value)`

Creates an `equal (=)` comparison operator

```js
const query = sqb.select().from('customer')
    .where(Op.eq('age', 16));
```
```sql
select * from customer
where age = 16
```


### Op.ne()

Creates an `not equal (!=)` comparison operator

`Op.ne(expression, value)`

```js
const query = sqb.select().from('customer')
    .where(Op.ne('age', 16));
```
```sql
select * from customer
where age not = 16
```

### Op.gt()

Creates an `greater than (>)` comparison operator

`Op.gt(expression, value)`

```js
const query = sqb.select().from('customer')
    .where(Op.gt('age', 16));
```
```sql
select * from customer
where age > 16
```

### Op.gte()

Creates an `greater than or equal to (>=)` comparison operator

`Op.gte(expression, value)`

```js
const query = sqb.select().from('customer')
    .where(Op.gte('age', 16));
```
```sql
select * from customer
where age >= 16
```

### Op.lt()

Creates an `lower than (>)` comparison operator

`Op.gt(expression, value)`

```js
const query = sqb.select().from('customer')
    .where(Op.lt('age', 16));
```
```sql
select * from customer
where age < 16
```

### Op.lte()

Creates an `lower than or equal to (<=)` comparison operator

`Op.gte(expression, value)`

```js
const query = sqb.select().from('customer')
    .where(Op.lte('age', 16));
```
```sql
select * from customer
where age <= 16
```

### Op.between()

Creates an `between` comparison operator

`Op.gte(expression, first, second)`

```js
const query = sqb.select().from('customer')
    .where(Op.between('age', 16, 28));
```
```sql
select * from customer
where age between 16 and 28
```

### Op.notBetween()

Creates an `not between` comparison operator

`Op.gte(expression, first, second)`

```js
const query = sqb.select().from('customer')
    .where(Op.notBetween('age', 16, 28));
```
```sql
select * from customer
where age not between 16 and 28
```

### Op.is()

Creates an `is` comparison operator

`Op.is(expression, value)`

```js
const query = sqb.select().from('customer')
    .where(Op.is('gender', null));
```
```sql
select * from customer
where gender is null
```

### Op.not()

Creates an `is not` comparison operator

`Op.is(expression, value)`

```js
const query = sqb.select().from('customer')
    .where(Op.not('gender', null));
```
```sql
select * from customer
where gender is not null
```

### Op.like()

Creates an `like` comparison operator

`Op.gte(expression, value)`

```js
const query = sqb.select().from('customer')
    .where(Op.like('name', '%John%'));
```
```sql
select * from customer
where name like '%John%'
```

### Op.notLike()

Creates an `not like` comparison operator

`Op.gte(expression, value)`

```js
const query = sqb.select().from('customer')
    .where(Op.notLike('name', '%John%'));
```
```sql
select * from customer
where name not like '%John%'
```

### Op.ilike()

Creates an `ilike` comparison operator

`Op.gte(expression, value)`

```js
const query = sqb.select().from('customer')
    .where(Op.ilike('name', '%John%'));
```
```sql
select * from customer
where name ilike '%John%'
```

### Op.notILike()

Creates an `not ilike` comparison operator

`Op.gte(expression, value)`

```js
const query = sqb.select().from('customer')
    .where(Op.notILike('name', '%John%'));
```
```sql
select * from customer
where name not ilike '%John%'
```

### B. Native JS objects

Alternatively SQB supports defining conditional expressions using native JS objects.

#### Using native JS objects

##### Example-1
```js
const query = sqb.select().from('customer')
    .where({name: 'John'});
```
```sql
select * from customer
where name = 'John'
```

##### Example-2
```js
const query = sqb.select().from('customer')
    .where({'name like': '%John%', 'age>=': 18});
```
```sql
select * from customer
where name like '%John%' and age >= 18
```

##### Example-3
```js
const query = sqb.select().from('customer')
    .where({'name !like': '%John%', 'age in': [18,19,20]});
```
```sql
select * from customer
where name not like '%John%' and age in (18,19,20)
```
