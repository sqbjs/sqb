# MetaData class

MetaData is a special class that helps working with database meta data. 

## Index

#### Methods
- [MetaData.prototype.query()](#metadataprototypequery)

<hr/>

## Methods

### MetaData.prototype.query()
Queries database meta-data with given "request" object.

` metaData.query([request], callback)`

- `request` (Object) : Request object:
- `callback` (Function) : Function, taking one argument:

  `function(error)`  
  - `error` (`Error`): Error object, if method fails. Undefined otherwise.


- **Returns** : If method is invoked with a callback, it returns a Undefined. Otherwise it returns Promise.


#### Examples for databases which support schemas (Oracle, Postgres, MSSQL etc)

```js
// Query all 
pool.metaData.query(function(err, result) {
  // ...
});

// Query all 
pool.metaData.query({
  schemas: '*'
}, function(err, result) {
  // ...
});

// Query all under "my_schema"
pool.metaData.query({
  schemas: {
    my_schema: '*'
  }
}, function(err, result) {
  // ...
});

// Query only "table1" and "table2" under "my_schema"
pool.metaData.query({
  schemas: {
    my_schema: {
      tables: ['table1', 'table2']
    }
  }
}, function(err, result) {
  // ...
});

```

#### Examples for databases which does not support schemas (SQLite, Firebird, Interbase etc.)

```js
// Query all 
pool.metaData.query(function(err, result) {
  // ...
});

// Query all
pool.metaData.query({
  tables: '*'
}, function(err, result) {
  // ...
});


// Query only "table1" and "table2" under "my_schema"
pool.metaData.query({     
  tables: ['table1', 'table2']  
}, function(err, result) {
  // ...
});

```
