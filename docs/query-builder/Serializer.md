# Serializer Class

SQB library has a powerful serialization feature. It can be easily serialize sql queries to string. It also supports sql parameters. 

## Index

#### Properties
- [dialect](#dialect)
- [prettyPrint](#prettyPrint)
- [strictParams](#strictParams)

#### Methods
- [Serializer.prototype.acquire()](#serializerprototypegenerate)

<hr>

## Construction

SQB namespace exposes Serializer class and also SQB namespace has `serializer()` function that creates Serializer object.

**Note**: It is required to load serialization extension of target dialect before initializing a serializer.

`serializer = new sqb.Serializer(options)`

`serializer = sqb.serializer(options)`

- `options` (Object):
    - `dialect` (String): Name of the dialect to be used when serializing.

    - `prettyPrint` (Boolean=true): If true, sql string will be serialized pretty formatted. 

    - `paramType` (ParamType=ParamType.COLON): Controls how sql parameters will be serialized.
        - ParamType.COLON: Sql parameters will be serialized named (:param) format and result.params will be an Object instance that contains param:value pairs.
        - ParamType.QUESTION_MARK: Sql parameters will be serialized indexed (?) format and result.params will be an Array instance that contains values.
        - ParamType.DOLLAR: Sql parameters will be serialized indexed ($1) format and result.params will be an Array instance that contains values.

    - `strictParams` (Boolean=false): Controls how conditional values will be serialized. 
        - When "false" values will be serialized into sql string.
        - When "true" values will be serialized as parameters.

<hr>

### Properties

- `dialect` (String): Name of the dialect to be used when serializing.

- `prettyPrint` (Boolean=true): If true, sql string will be serialized pretty formatted. 

- `paramType` (ParamType=ParamType.COLON): Controls how sql parameters will be serialized.
    - ParamType.COLON: Sql parameters will be serialized named (:param) format and result.params will be an Object instance that contains param:value pairs.
    - ParamType.QUESTION_MARK: Sql parameters will be serialized indexed (?) format and result.params will be an Array instance that contains values.
    - ParamType.DOLLAR: Sql parameters will be serialized indexed ($1) format and result.params will be an Array instance that contains values.

- `strictParams` (Boolean=false): Controls how conditional values will be serialized. 
    - When "false" values will be serialized into sql string.
    - When "true" values will be serialized as parameters.

<hr>

## Methods

### Serializer.prototype.generate() 
Serializes `query` object to sql string and parameter values.

`.generate(query[, values])`

- `query` (Query): Instance of an Query class
- `values` (Object): Object instance contains parameter/value pairs.
- **Returns** (Object): It returns object instance contains sql and values.
    - `sql` (String): Serialized sql string
    - `values` (Array|Object): Depends on paramType this property contains array of values or objects instance that contains parameter/value pairs


## How To Use

### Alternative - 1

```js
const sqb = require('sqb');

// Step 1 - Load serialization extension
sqb.use(require('sqb-serializer-oracle')); /

// Step 2 - Initialize serializer
const serializer = sqb.serializer({
      dialect:'oracle',  
      prettyPrint: true 
    });

// Step 3 - Create a query object
query =
    sqb.select('b.ID book_id',
        'b.name book_name', 'c.name category_name')
        .from('BOOKS b')
        .join(sqb.join('CATEGORY c').on('c.id', sqb.raw('b.category_id')));

// Step 4 - Serialize the query    
const result = serializer.generate(query);

// Step 5 - Use the result in your code
console.log(result.sql);
```

### Alternative - 2

```js
const sqb = require('sqb');

// Step 1 - Load serialization extension
sqb.use(require('sqb-serializer-oracle')); /

// Step 2 - Create a query object
query =
    sqb.select('b.ID book_id',
        'b.name book_name', 'c.name category_name')
        .from('BOOKS b')
        .join(sqb.join('CATEGORY c').on('c.id', sqb.raw('b.category_id')));

// Step 3 - Serialize the query with given options   
const result = query.generate({
      dialect:'oracle',  
      prettyPrint: true 
    });

// Step 4 - Use the result in your code
console.log(result.sql);
```



