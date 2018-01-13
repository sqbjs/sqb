# Serializing

SQB library has a powerful JS to SQL serialization feature. All Query classes have generate() method which serializes JS object into SQL string.

`query.generate(options[, values])`

- `options` (Object):

    - `dialect` (String): Name of the dialect to be used when serializing.

    - `prettyPrint` (Boolean=true): If true, sql string will be serialized pretty formatted. 

    - `paramType` (ParamType=ParamType.COLON): Controls how sql parameters will be serialized.
        - ParamType.COLON: Sql parameters will be serialized (:param) format and result.params will be an Object instance that contains param:value pairs.
        - ParamType.QUESTION_MARK: Sql parameters will be serialized (?) format and result.params will be an Array instance that contains values.
        - ParamType.DOLLAR: Sql parameters will be serialized ($1) format and result.params will be an Array instance that contains values.
        - ParamType.AT: Sql parameters will be serialized (@param) format and result.params will be an Object instance that contains param:value pairs.
        
- `values` (Object): Object instance contains parameter/value pairs.

- **Returns** (Object): It returns object instance contains sql and parameter values.
    - `sql` (String): Serialized sql string
    - `values` (Array|Object): Depends on paramType this property contains array of values or objects instance that contains parameter/value pairs

## How To Use

### Example - 1

```js
const sqb = require('sqb');

// Step 1 - Load serialization extension
sqb.use(require('sqb-serializer-pg'));

// Step 2 - Create a query object
query = sqb.select('b.ID book_id',
        'b.name book_name', 'c.name category_name')
        .from('BOOKS b')
        .join(sqb.join('CATEGORY c').on(Op.eq('c.id', sqb.raw('b.category_id'))));

// Step 3 - Serialize the query    
const result = serializer.generate({
    dialect:'pg',  
    prettyPrint: true 
});

// Step 4 - Use the result in your code
console.log(result.sql);
```

### Example - 2

```js
const sqb = require('sqb');
const Op = sqb.Op;

// Step 1 - Load serialization extension
sqb.use(require('sqb-serializer-pg'));

// Step 2 - Create a query object
query =
    sqb.select('b.ID book_id',
        'b.name book_name', 'c.name category_name')
        .from('BOOKS b')
        .join(sqb.join('CATEGORY c').on(Op.eq('c.id', sqb.raw('b.category_id'))))
        .where(Op.like('c.name', '%potter%'))

// Step 3 - Serialize the query with given config   
const result = query.generate({
      dialect:'pg',  
      prettyPrint: true 
    });

// Step 4 - Use the result in your code
console.log(result.sql);
console.log(result.values);
```



