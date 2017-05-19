# SQB

[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]
[![Build Status][travis-image]][travis-url]
[![Test Coverage][coveralls-image]][coveralls-url]
[![Dependencies][dependencies-image]][dependencies-url]
[![Gitter chat][gitter-image]][gitter-url]
[![Package Quality][quality-image]][quality-url]

SQB is a lightweight, multi-dialect SQL query builder for JavaScript;

Note: SQB is in alpha state. Use it only for testing purposes only! 

```js
const sqb = require('sqb'),
    /* Shortcuts for more clear coding */
    and = sqb.and,
    or = sqb.or,
    innerJoin = sqb.innerJoin,
    select = sqb.select,
    raw = sqb.raw;

let sql =
    select(
        'b.ID as book_id', 'b.name book_name', 'c.name category_name',
        select(raw('count(*)')).from('articles a')
            .where(and('a.book_id', '=', raw("b.id"))).alias('article_count')
    )
        .from('BOOKS b')
        .join(
            innerJoin('category c')
                .on(and('c.id', '=', raw('b.category_id')), and('c.kind', 'science'))
        )
        .where(
            and('name', 'like', /name/),
            and([
                or('release_date', 'between', /release_date/),
                or('release_date', 'between', new Date(2015, 0, 1, 0, 0, 0, 0), new Date(2016, 0, 1, 0, 0, 0, 0)),
            ]),
            and([
                or('c.name', '=', 'novel'),
                or('c.name', '=', 'horror'),
                or('c.name', '=', 'child'),
                or(select('name').from('category').where(and('id', 5)))
            ])
        )
        .orderBy("c.name", "b.release_date desc");

let result = sql.build({
    dialect: "generic",
    prettyPrint: true,
    namedParams: false,
    params: {
        name: 'WHTE DOG',
        release_date: [new Date(2000, 0, 1, 0, 0, 0, 0), new Date(2001, 0, 1, 0, 0, 0, 0)]
    }
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
where name like ? and (release_date between ? and ?
        or release_date between '2015-01-01' and '2016-01-01')
    and (c.name = 'novel' or c.name = 'horror' or c.name = 'child'
        or (select name from category where id = 5) = null)
order by c.name, b.release_date desc
```

Paremeters output

```
[ 'WHTE DOG', 2000-01-01T00:00:00.000Z, 2001-01-01T00:00:00.000Z ]
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
[dependencies-image]: https://david-dm.org/panates/sqb.svg
[dependencies-url]:https://david-dm.org/panates/sqb#info=dependencies
[quality-image]: http://npm.packagequality.com/shield/eonc-rest.png
[quality-url]: http://packagequality.com/#?package=sqb