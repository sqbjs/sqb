# SQL Query Builder

The starting point of the SQB library is building sql queries for any dialect with a single codebase in JavaScript. SQB coding style is very similar to sql language.

```js
const sqb = require('sqb');
sqb.use(require('sqb-serializer-oracle'));
/* Shortcuts for more clear coding */
const innerJoin = sqb.innerJoin;
const select = sqb.select;
const raw = sqb.raw;
/* Initialize serializer */
const serializer = sqb.serializer({
      dialect: 'oracle',  // Use Oracle serializer
      prettyPrint: true
    });

const query =
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

let result = serializer.build(query,{
    name: 'WIHTE DOG',
    release_date: [new Date(2000, 0, 1, 0, 0, 0, 0), new Date(2001, 0, 1, 0, 0, 0, 0)]
    });
console.log(result.sql);
console.log(result.params);
```
Outputs
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
```js
[ 'WIHTE DOG', 2000-01-01T00:00:00.000Z, 2001-01-01T00:00:00.000Z ]
```



