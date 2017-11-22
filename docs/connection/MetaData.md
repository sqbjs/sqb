# MetaData class

MetaData is a special class that helps working with database meta data. 

## Index

#### Methods
- [MetaData.prototype.select()](#metadataprototypeselect)

<hr/>

## Construction

SQB namespace exposes MetaData class. And also Pool and Connection objects have `metaData()` methods that creates a MetaData instance.

`metaData = new sqb.MetaData(pool)`
`metaData = pool.metaData()`
`metaData = new sqb.MetaData(connection)`
`metaData = connection.metaData()`

<hr/>

## Methods

### MetaData.prototype.select()
Creates an executable [MetaDataSelect](connection/MetaDataSelect.md) instance associated with owner (Pool/Connection).

`query = metaData.select()`

```js
metaData = pool.metaData();
metaData.select()
  .from('schemas')
  .where('schema_name', 'like', 'my_%')
```
