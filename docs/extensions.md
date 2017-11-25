# Extensions

SQB is designed to be a lightweight and extensible interface to keep applications need less memory and work fast. Any application can load only required extension to use great sqb features, such as serialization and connection. There is currently two kind of extensions. Serializer extensions and connection adapters. Generally connection adapters includes required serializer extensions and it is not needed to load both at same time.


```js
const sqb = require('sqb');
sqb.use(require('sqb-serializer-oracle')); // Load Oracle serialization
const sr = sqb.serializer('oracle'); // Create Oracle serializer
```

```js
const sqb = require('sqb');
sqb.use(require('sqb-connect-pg')); // Load adapter for Postgre SQL driver

const sr = sqb.createPool({
dialect:'postgres',
user: 'anyuser',
password: 'anypass',
database: 'dbpath'
}); // Create Postgre SQL connection pool
```

## Known Extensions

|Extension|Category|Features|
|---|---|---|
|[sqb-connect-oracledb](https://github.com/panates/sqb-connect-oracledb)<br>Connection adapter for Oracle<br>Includes: [oracledb](https://github.com/oracle/node-oracledb), [sqb-serializer-oracle](https://github.com/panates/sqb-serializer-oracle)|Adapter|Native<br>:white_check_mark: Cursor<br>:white_check_mark: MetaData/Query|
|[sqb-connect-pg](https://github.com/panates/sqb-connect-pg)<br>Connection adapter for Postgre SQL<br>Includes: [node-postgres](https://github.com/brianc/node-postgres), [sqb-serializer-pg](https://github.com/panates/sqb-serializer-pg)|Adapter|PureJS<br>:white_check_mark: Cursor<br>:x: MetaData/Query|
|[sqb-connect-sqlite](https://github.com/panates/sqb-connect-sqlite)<br>Connection adapter for SQLite<br>Includes: [node-sqlite3](https://github.com/mapbox/node-sqlite3), [sqb-serializer-pg](https://github.com/panates/sqb-serializer-sqlite)|Adapter|PureJS<br>:white_check_mark: Cursor<br>:white_check_mark: MetaData/Query|
|[sqb-serializer-oracle](https://github.com/panates/sqb-serializer-oracle)<br>Serializer extension for Oracle|Serialization|-|
|[sqb-serializer-pg](https://github.com/panates/sqb-serializer-pg)<br>Serializer extension for Postgre SQL|Serialization|-|

