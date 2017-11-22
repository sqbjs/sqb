# MetaDataSelect class

MetaDataSelect allows creating select queries for database meta data. 

## Index

#### Methods
- [MetaDataSelect.prototype.select()](#metadataselectprototypefrom)

<hr/>

## Construction

MetaData instance has `select()` method that creates a MetaDataSelect instance.

`metaDataSelect = metaData.select([..columns])`

- `columns` (String): Field names.


<hr/>

## Methods

### MetaDataSelect.prototype.from()
Builds an executable [SelectQuery](query-builder/query/SelectQuery.md) for given meta-data table.

`query = metaDataSelect.from(selector)`

- `selector` (Enum`<String>`): Predefined meta-data [selector](#predefinedmetadataselectors)

```js
metaData = pool.metaData();
var query = metaData.select('table_name')
  .from('tables')
  .where('schema_name', '=', 'my_schema');
  
query.execute().then(function(result){
  // Print out tables
  console.log(result.rowSet.rows);
});  
```

## Predefined Meta-Data selectors

### Schemas
Selector for schemas.

|Field Name|Description|
|---|---------|
|schema_name|Name of the schema|
|create_date|Schema creation date|

### Tables
Selector for tables.

|Field Name|Description|
|---|---------|
|schema_name|Name of the schema which table belongs to|
|table_name|Name of the table|
|num_rows|Number of rows in table|
|table_comments|Table comments|

### Columns
Selector for columns.

|Field Name|Description|
|---|---------|
|schema_name|Name of the schema which column belongs to|
|table_name|Name of the table which column belongs to|
|column_name|Name of the column|
|data_type|Data type (encapsulated)|
|data_type_org|Data type (original)|
|data_length|Data length|
|data_precision|Precision|
|data_scale|Scale|
|nullable|Is column nullable? Enum(1=True,0=False)|
|column_comments|Column comments|


### Primary_Keys
Selector for primary keys.

|Field Name|Description|
|---|---------|
|schema_name|Name of the schema which primary key belongs to|
|table_name|Name of the table which primary key belongs to|
|constraint_name|Name of the constraint|
|columns|Column names separated with comma|
|data_type_org|Data type (original)|
|enabled|Is constraint enabled? Enum(1=True,0=False)|


### Foreign_Keys
Selector for foreign keys.

|Field Name|Description|
|---|---------|
|schema_name|Name of the schema which primary key belongs to|
|table_name|Name of the table which primary key belongs to|
|constraint_name|Name of the constraint|
|column_name|Column name which foreign key belongs to|
|r_schema|Remote schema name|
|r_table_name|Remote table name|
|r_columns|Remote column names separated with comma|
|enabled|Is constraint enabled? Enum(1=True,0=False)|




