# SQL Conditions

Defining sql conditions in SQB described below.

```batch
   select().where(  |
   join().on(       |  Starts condition group
   case().when(     |
   
[  ===> Start new group (optional)
   
   [  'FieldName',   '=',    Value   ]  ===> Condition
         ^          ^         ^
         |          |         |
         |          |          --> Value
         |          --> Comparison operator (optional)
         --> Field Name
         
   , 'or'  ===> logical operator (optional)
   
   ['FieldName, Value] ===> Condition    
                  
]  ===> Close group

, 'and'  ===> logical operator (optional)
    
['FieldName', Value] ===> Condition
  
```

- `Field Name` (String|SelectQuery|Raw): String representation of field name, SelectQuery for sub-selects or Raw object.
- `Comparison Operators` (String): 
   - `=` : Is equal to 
   - `!=` : Is not equal
   - `not =` : Is not equal 
   - `>` : Is greater then 
   - `!>` : Is not greater then 
   - `<` : Is lower then 
   - `!<` : Is not lower then 
   - `>=` : Is greater or equal to 
   - `<=` : Is lower or equal to  
   - `<>` : Is lower or greater then 
   - `is` : Is    
   - `between` : Between
   - `!between` : Not between
   - `not between` : Not between
   - `like` : Like
   - `!like` : Not like
   - `not like` : Not like
   
- `Value` (RegExp|String|Number|Date|Array|SelectQuery|Case): Value of condition

- `Logical Operators` (String): 
   - `or`
   - `and`
   - `not`
   
#### Example-1
```js
var query = sqb.select().from('customer')
    .where(
        ['Gender', 'M'],
        ['Balance', '>=', 100],
        ['BirthDate', 'between', [new Date(2000, 0, 1), new Date(2015, 11, 31)]],
        [
          ['State', 'CL'],
          'or',
          ['State', 'TX'],
          ['Country', '!=', 'USA']
        ]
    );
```
```sql
Generated SQL for Postgres:
select * from customer
where Gender = 'M' and Balance >= 100 and 
  BirthDate between '2000-01-01' and '2015-12-31' and
  (State = 'CL' or State = 'TX' or Country != 'USA')
```
#### Example-2
```js
var query = sqb.select().from('customer')
    .where(
        ['Name', 'like', '%John%'],
        ['Age', 'between', [25, 35]],
        [
          ['State', ['CL', 'TX']],
          'or',
          ['Country', '!=', 'USA']
        ]
    );
```
```sql
Generated SQL for Postgres:
select * from customer
where Name like '%John%' and 
  Age between 25 and 35 and 
  (State in ('CL','TX') or Country != 'USA')
```
#### Example-3
```js
var query = sqb.select().from('customer')
    .where(
        ['Name', '=', sqb.select('name').from('person').where(['id', 1])],
        ['Age', '=', sqb.case()
            .when(['gender', 'F']).then(18)
            .when(['gender', 'M']).then(20)
            .else(25)],
        [sqb.select('State').from('person').where(['id', 1]), ['CL', 'TX']]
    );
```
```sql
Generated SQL for Postgres:
select * from customer
where Name in (select name from person where id = 1) and Age in (case
  when gender = 'F' then 18
  when gender = 'M' then 20
  else 25
end) and
  (select State from person where id = 1) in ('CL','TX')
```

#### Example-4
```js
var query = sqb.select().from('customer')
    .where(
        ['Gender', /Gender/],
        ['Balance', '>=', /Balance/],
        ['BirthDate', 'between', /BirthDate/],
        [
          ['State', /State/],
          'or',
          ['Country', '!=', /Country/]
        ]
    );
result = serializer.generate(query, {
  Gender: 'M',
  Balance: 100,
  BirthDate: [new Date(2000, 0, 1), new Date(2015, 11, 31)],
  Country: 'USA'
});
console.log(result.sql);
console.log(result.values); 
```
```sql
Generated SQL for Postgres:
select * from customer
where Gender = $1 and Balance >= $2 and 
  BirthDate between $3 and $4 and
  (State = $5 or Country != $6)
```
```js
Generated Values for Postgres:
[ 'M',
  100,
  1999-12-31T21:00:00.000Z,
  2015-12-30T21:00:00.000Z,
  null,
  'USA' ]
```
```sql
Generated SQL for Oracle:
where Gender = :Gender and Balance >= :Balance and 
  BirthDate between :BirthDate1 and :BirthDate2 and
  (State = :State or Country != :Country)
```
```js
Generated Values for Oracle:
{ Gender: 'M',
  Balance: 100,
  BirthDate1: 1999-12-31T21:00:00.000Z,
  BirthDate2: 2015-12-30T21:00:00.000Z,
  State: null,
  Country: 'USA' }
```









