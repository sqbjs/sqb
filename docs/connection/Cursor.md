# Cursor class

When the number of query rows is relatively big, or can't be predicted, it is recommended to use a Cursor. This prevents query results being unexpectedly truncated by the maxRows limit and removes the need to oversize maxRows to avoid such truncation.

## Index

#### Properties
- [isBof](#isbof)
- [isClosed](#isclosed)
- [isEof](#iseof)
- [fetchedRows](#fetchedrows)
- [fields](#fields)
- [row](#row)
- [rowNum](#rownum)

#### Methods
- [Cursor.prototype.cached()](#cursorprototypecached)
- [Cursor.prototype.close()](#cursorprototypeclose)
- [Cursor.prototype.fetchAll()](#cursorprototypefetcheall)
- [Cursor.prototype.get()](#cursorprototypeget)
- [Cursor.prototype.moveTo()](#cursorprototypemoveto)
- [Cursor.prototype.next()](#cursorprototypenext)
- [Cursor.prototype.prev()](#cursorprototypeprev)
- [Cursor.prototype.reset()](#cursorprototypereset)
- [Cursor.prototype.seek()](#cursorprototypeseek)
- [Cursor.prototype.set()](#cursorprototypeset)

#### Events
- [close](#closeevent)
- [eof](#eofevent)
- [move](#moveevent)
- [fetch](#fetchevent)

<hr/>

## Construction

Cursor object is created when executing a query with `cursor=true` option. 

Cursor increases Connection reference counter and keeps it open until `cursor.close()` called.

## Properties
        
### connection 
*getter (Connection)*

This is a read only property that returns the [Connection](connection/Connection.md) instance.

### isBof
*getter (Boolean)*

This is a read only property that returns if cursor is before first record.

### isClosed
*getter (Boolean)*

This is a read only property that returns if cursor is closed.

### isEof
*getter (Boolean)*

This is a read only property that returns if cursor is after last record.
    
### fetchedRows
*getter (Number)*

This is a read only property that returns number of fetched record count from database.

### fields
*getter ([FieldCollection](connection/FieldCollection.md))*

This is a read only property that returns FieldCollection instance which contains information about fields.

### row
*getter (Object|Array)*

This method returns current record. If query executed with `objectRows=true` option, this property returns object that contains field name/value pairs, otherwise it returns array of values.

### rowNum
*getter (Number)*

This is a read only property that returns current row number.

<hr/>

## Methods

### Cursor.prototype.cached()

This call enables caching fetched rows and lets `Cursor` to move both forward and backward. This method must be called before fetching any record otherwise it throws error.

***Note:*** *It is not recommended enabling caching for large dataset. This may cause memory overhead.*

`cursor.cached()`
  
```js
pool.select('*').from('table1')
  .then({cursor: true}, (result) => {
    const cursor = result.cursor;
    cursor.cached();
    ....
    Now cursor can move forward and backward.
    ....
    cursor.close();
});
```
*In the example above, the dataset will be closed after last sub operation finishes.*
   

### Cursor.prototype.close()
This call closes cursor permanently and releases [Connection](connection/Connection.md). 

`close([callback])`

- `callback` (Function) : Function, taking one argument:
  
  `function(error)`
  
  - `error` (`Error`): Error object, if method fails. Undefined otherwise.


- **Returns:** If method is invoked with a callback, it returns a Undefined. Otherwise it returns Promise.
    

```js
cursor.close((error) => {
  if (error)
    return console.error(error); 
 console.log('Cursor closed');
});
```

### Cursor.prototype.fetchAll()
If cache is enabled, this call fetches and keeps all records in the internal cache. Otherwise it throws error. Once all all records fetched, you can close `Cursor` safely and can continue to use it in memory.

`cursor.fetchAll([callback])`

- `callback` (Function) : Function, taking one argument:
  
  `function(error)`
  
  - `error` (`Error`): Error object, if method fails. Undefined otherwise.


- **Returns:** If method is invoked with a callback, it returns a Undefined. Otherwise it returns Promise.
    

```js
await cursor.fetchAll();
await cursor.close(); // Closes Cursor and releases Connection.
....
do whatever u want with memory cursor.

});
```

### Cursor.prototype.get()
This call returns value of given field name of current record.

`cursor.get(field)`

- `field` (String|Number) : Name or index of the field. Note that, field name is case insensitive.

- **Returns:** Value of the field.
    

```js
cursor.get('Name'); // Gets value of field "Name"
cursor.get('name'); // Gets value of field "Name"
cursor.get(0); // Gets value of field at 0
```

### Cursor.prototype.moveTo()
This call moves cursor to given row number. If caching is enabled, cursor can move both forward and backward. Otherwise it throws error.

`cursor.moveTo(rowNum[, callback])`

- `rowNum` (Number) : Row number that will cursor move to. Note that first row number is 1.

- `callback` (Function) : Function, taking one argument:
  
  `function(error)`
  
  - `error` (`Error`): Error object, if method fails. Undefined otherwise.


- **Returns:** If method is invoked with a callback, it returns a Undefined. Otherwise it returns Promise.
    

```js
await cursor.moveTo(5);
var val = cursor.get('Name'); // Reads Name field of 5th record.
```


### Cursor.prototype.next()
This call moves cursor forward by one row and returns that row. And also it allows iterating over rows easily. 

`cursor.next([callback])`

- `callback` (Function) : Function, taking three arguments:
  
  `function(error, row, more)`
  
  - `error` (`Error`): Error object, if method fails. Undefined otherwise.
  - `row` (`Object`): Current row.
  
  - `more` (`Function`): Function that fetches one more record.

- **Returns:** If method is invoked with a callback, it returns a Undefined. Otherwise it returns Promise.
    

```js
// Iterates rows until EOF
cursor.next((error, row, more) => {
  if (row) {
    console.log(cursor.rowNum, row.ID, row.Name);
    more();
  } else cursor.close();
});
```
```js
// Fetches next row
var row = await cursor.next();
if (row)
  console.log(cursor.rowNum, row.ID, row.Name);    
});
```

### Cursor.prototype.prev()
This call moves cursor back by one row and returns that row. And also it allows iterating over rows easily.

**Note:** Cache must be enabled to move cursor back.

`cursor.prev([callback])`

- `callback` (Function) : Function, taking three arguments:
  
  `function(error, row, more)`
  
  - `error` (`Error`): Error object, if method fails. Undefined otherwise.
  - `row` (`Object`): Current row.
  
  - `more` (`Function`): Function that fetches one more record.

- **Returns:** If method is invoked with a callback, it returns a Undefined. Otherwise it returns Promise.
    

```js
// Iterates rows until BOF
cursor.prev((error, row, more) => {
  if (row) {
    console.log(cursor.rowNum, row.ID, row.Name);
    more();
  };
});
```
```js
// Fetches previous row
var row = await cursor.prev();
if (row)
  console.log(cursor.rowNum, row.ID, row.Name);    
});
```

### Cursor.prototype.reset()
This call moves cursor before first row.

**Note:** Cache must be enabled to move cursor back.

`cursor.reset()`


### Cursor.prototype.seek()
This call moves cursor by given step. If caching is enabled, cursor can move both forward and backward. Otherwise it throws error.

`cursor.seek(step[, callback])`

- `step` (Number) : Number of rows that will cursor move by. Negative number moves cursor backward.

- `callback` (Function) : Function, taking one argument:
  
  `function(error)`
  
  - `error` (`Error`): Error object, if method fails. Undefined otherwise.


- **Returns:** If method is invoked with a callback, it returns a Undefined. Otherwise it returns Promise.
    

```js
await cursor.step(-5); // Moves cursor back by 5 rows
var val = cursor.get('Name');
```

### Cursor.prototype.set()
This call updates cached value of given field name of current record.

**Note:** *This call only updates memory and does not make an update in database*

`cursor.get(field, value)`

- `field` (String|Number) : Name or index of the field. Note that, field name is case insensitive.
- `value` (*) : Value of the field.
    
```js
cursor.set('Name', 'John');
cursor.set('name', 'John');
cursor.set(0, 12345); 
```


### Cursor.prototype.toStream()
This method returns a readable stream.

`toStream([options])`

- `options` (Object):
    
  - `objectMode` (Boolean=false): If set true, stream will output rows as objects. If false, it will output string buffer.  
   
  - `limit` (Number): Sets how many rows will be fetched with stream.

  - ***outFormat*** [Enum`<Number>`]: Set the output format.
    - 'default' | 0 : Default format
      ```js
      {
        fields: {...},
        rows: [...rows],
        numRows: 10,
        eof: true
      }
      ```
    - 'basic' | 1 : Basic format
      ```js
      [...rows]
      ```
  - `stringify` (Function): Custom method to stringify objects.

- ***Returns:*** CursorStream.

```js
const stream = cursor.toStream();
stream.pipe(process.stdout);
```

<hr/>

## Events

### <a id="closeevent"></a>close

This event is called when `Cursor` is closed.

```js
cursor.on('close', () => {
    console.log('Cursor closed');
});
```

### <a id="eofevent"></a>eof

This event is called once when there is no more rows to be fetched from database.

```js
cursor.on('eof', () => {
    console.log('No more rows');
});
```

### <a id="moveevent"></a>move

This event is called when current row number changed.

```js
cursor.on('move', (rowNum) => {
    console.log('Current row is '+ rowNum);
});
```

### <a id="fetchevent"></a>fetch

This event is called when new record fetched from database. It allows modifying row values before row is cached or returned as a result.

```js
cursor.on('fetch', (row, rowNum) => {
  row.date_field = new Date(); // modify the row before it is cached
});
```

