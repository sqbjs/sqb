//require('sqb-serializer-oracle');

const sqb = require('./'),
    innerJoin = sqb.innerJoin,
    select = sqb.select,
    raw = sqb.raw;


let statement, result,
    serializer = sqb.serializer({
      //dialect: 'oracle',
      //prettyPrint: true,
      namedParams: true
    });

statement = sqb.select('ID', 'ADI').from('ULKE')
    .identify('aaaaa')
    .where(['id', '>=', /ID1/])
    .params({id1: 1});

/*
 statement = sqb.select(
 sqb.case().when(['id', 1], 'or', ['id', 2]).then(5).when('col2', 3).else(100).as('col1')
 ).from('table1').where(['ID', 1]);
 */

result = serializer.build(statement);

console.log('----------------------------------');
console.log(result.sql);
console.log(result.params);
console.log('----------------------------------');

return;
statement =
    select(
        'b.ID as book_id', 'b.name book_name', 'c.name category_name',
        select(raw('count(*)'))
            .from('articles a')
            .where(['a.book_id', '=', raw('b.id')])
            .as('article_count')
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
              ['release_date', 'between', [new Date(2015, 0, 1, 0, 0, 0, 0),
                new Date(2016, 0, 1, 0, 0, 0, 0)]]
            ],
            ['c.name', ['novel', 'horror', 'child']],
            [select('name').from('author').where(['id', raw('b.author_id')]),
              '=',
              'Jessica Parker']
        )
        .orderBy('c.name', 'b.release_date desc');

result = serializer.build(statement,
    {
      name: 'WIHTE DOG',
      release_date: [new Date(2000, 0, 1, 0, 0, 0, 0),
        new Date(2001, 0, 1, 0, 0, 0, 0)]
    });
console.log(result.sql);
console.log(result.params);

return;

//return;

/*

 let serializer = sqb.serializer({
 //dialect: "oracle",
 prettyPrint: true,
 namedParams: false
 }),
 statement, result;


 statement = sqb.select('table1')
 .where(
 //sqb.and('id',1)
 {'id': 1}
 );

 result = serializer.build(statement);


 console.log('----------------------------------');
 console.log(result.sql);
 console.log('----------------------------------');
 console.log(result.params);
 return;

 statement =
 select(
 'b.ID as book_id', 'b.name book_name', 'c.name category_name',
 select(raw('count(*)')).from('articles a')
 .where(and('a.book_id', '=', raw("b.id"))).as('article_count')
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


 //console.log(sql);

 result = statement.build({
 //dialect: "oracle",
 prettyPrint: true,
 namedParams: false,
 params: {
 name: 'WHTE DOG',
 release_date: [new Date(2000, 0, 1, 0, 0, 0, 0), new Date(2001, 0, 1, 0, 0, 0, 0)]
 }
 });
 console.log('----------------------------------');
 console.log(result.sql);
 console.log('----------------------------------');
 console.log(result.params);

 */