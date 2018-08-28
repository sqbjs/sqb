# MetaData class

MetaData is a special class that helps working with database meta data. 

## Index

#### Methods
- [MetaData.prototype.select()](#metadataprototypeselect)
- [MetaData.prototype.getSchemas()](#metadataprototypegetschemas)

<hr/>

## Methods

### MetaData.prototype.select()
Starts a function chain that helps creating a "select query" for querying meta-data.

` metaData.select([...column])`

- `column` : String representation of column name


#### Examples

```js
// Query schemas 
pool.metaData.select().from('schemas').execute().then(result => {
  // ...
});

// Query tables 
pool.metaData.select().from('tables')
  .where(['schema_name', 'my_schema'])
  .execute(function(err, result) {
    // ...
  });

// Query columns 
pool.metaData.select().from('columns')
  .where(['schema_name', 'my_schema'], ['table_name', 'like', 'TBL_%'])
  .execute().then(result => {
    // ...
  });

// Query primary keys 
pool.metaData.select().from('primary_keys')
  .where(['schema_name', 'my_schema'], ['table_name', 'TBL_1'])
  .execute().then(result => {
    // ...
  });

// Query foreign keys 
pool.metaData.select().from('foreign_keys')
  .where(['schema_name', 'my_schema'], ['table_name', 'TBL_1'])
  .execute().then(result => {
    // ...
  });

```



### MetaData.prototype.getSchemas()

  Queryies and returns SchemaMeta objects which helps working with database schema.
  
` metaData.getSchemas([schemaLike])`

- `schemaLike` : Allows filtering for schema names.


#### Examples

```js
// Query schemas 
let schemas = await pool.metaData.getSchemas('MY%');
let tables = awit schemas[0].getTables();
```
