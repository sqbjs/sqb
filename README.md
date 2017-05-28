# SQB

[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]
[![Build Status][travis-image]][travis-url]
[![Test Coverage][coveralls-image]][coveralls-url]
[![Dependencies][dependencies-image]][dependencies-url]
[![DevDependencies][devdependencies-image]][devdependencies-url]

SQB is a lightweight, multi-dialect SQL query builder for JavaScript;

Note: SQB is in alpha state. Use it only for testing purposes only! 


```js
const sqb = require('sqb'),
    /* Shortcuts for more clear coding */
    innerJoin = sqb.innerJoin,
    select = sqb.select,
    raw = sqb.raw,
    serializer = sqb.serializer({
      dialect:'oracle',
      prettyPrint: true,
      namedParams: false
    });

let statement =
        select(
            'b.ID as book_id', 'b.name book_name', 'c.name category_name',
            select(raw('count(*)')).from('articles a')
                .where(['a.book_id', '=', raw("b.id")]).alias('article_count')
        ).from('BOOKS b')
            .join(
                innerJoin('category c')
                    .on(['c.id', '=', raw('b.category_id')], ['c.kind', 'science'])
            )
            .where(
                ['b.id', '>=', 1],
                ['b.id', '<', 100],
                ['b.name', 'like', /name/],
                [
                    ['release_date', 'between', /release_date/], 'or',
                    ['release_date', 'between', [new Date(2015, 0, 1, 0, 0, 0, 0), new Date(2016, 0, 1, 0, 0, 0, 0)]],
                ],
                ['c.name', ['novel', 'horror', 'child']],
                [select('name').from('author').where(['id', raw('b.author_id')]), '=', 'Jessica Parker']
            )
            .orderBy("c.name", "b.release_date desc");

let result = serializer.build(statement,
    {
        name: 'WIHTE DOG',
        release_date: [new Date(2000, 0, 1, 0, 0, 0, 0), new Date(2001, 0, 1, 0, 0, 0, 0)]
    });
console.log(result.sql);
console.log(result.params);

```

SQL output

```sql
select b.ID book_id, b.name book_name, c.name category_name, 
    (select count(*) from articles a where a.book_id = b.id) article_count
from BOOKS b
  inner join category c on c.id = b.category_id and c.kind = 'science'
where b.id >= 1 and b.id < 100 and b.name like ? and (release_date between ? and ?
        or release_date between to_date('2015-01-01', 'yyyy-mm-dd') and to_date('2016-01-01', 'yyyy-mm-dd'))
    and c.name in ('novel','horror','child')
    and (select name from author where id = b.author_id) = 'Jessica Parker'
order by c.name, b.release_date desc
```

Paremeters output

```
[ 'WIHTE DOG', 2000-01-01T00:00:00.000Z, 2001-01-01T00:00:00.000Z ]
```
## Getting started

Codding pattern in SQB is very similar to standard sql language.

## Insert statements

SQB supports both Array and Object argument to pass values into Insert statements.

```js
let statement = sqb.insert('id', 'name', 'address').into('BOOKS')
    .values([1, 'Hello SQB', 'The Earth']);
```
or
```js
let statement = sqb.insert('id', 'name', 'address').into('BOOKS')
    .values({
      id:-1, 
      name: 'Hello SQB', 
      address:'The Earth'
    });

let result = statement.build();
```
result.sql output will be 
```sql
insert into BOOKS (id, name, address) values (1, 'Hello SQB', 'The Earth')
```

## Serialising with parameters

SQB can generate parameter placeholders except serializing values. To do this, just place field names in RegExp pattern.

```js
let statement = sqb.insert('id', 'name', 'address').into('BOOKS')
    .values([/id/, /name/, /address/]);

let result = statement.build(
    {namedParams: false}, 
    [1, 'Hello SQB', 'The Earth']);

console.log(result.sql);
console.log(result.params);

```
result.sql output will be
```sql
insert into books (id, name, address) values (?, ?, ?)
```
result.params output will be
```
[ 1, 'Hello SQB', 'The Earth' ]
```

## Node Compatibility

  - node `>= 6.x`;
  
### License
[MIT](LICENSE)

[npm-image]: https://img.shields.io/npm/v/sqb.svg
[npm-url]: https://npmjs.org/package/sqb
[travis-image]: https://img.shields.io/travis/panates/sqb/master.svg
[travis-url]: https://travis-ci.org/panates/sqb
[coveralls-image]: https://img.shields.io/coveralls/panates/sqb/master.svg
[coveralls-url]: https://coveralls.io/r/panates/sqb
[downloads-image]: https://img.shields.io/npm/dm/sqb.svg
[downloads-url]: https://npmjs.org/package/sqb
[gitter-image]: https://badges.gitter.im/panates/sqb.svg
[gitter-url]: https://gitter.im/panates/sqb?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge
[dependencies-image]: https://david-dm.org/panates/sqb/status.svg
[dependencies-url]:https://david-dm.org/panates/sqb
[devdependencies-image]: https://david-dm.org/panates/sqb/dev-status.svg
[devdependencies-url]:https://david-dm.org/panates/sqb?type=dev
[quality-image]: http://npm.packagequality.com/shield/sqb.png
[quality-url]: http://packagequality.com/#?package=sqb