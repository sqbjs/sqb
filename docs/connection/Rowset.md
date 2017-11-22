# Rowset class

Rowset is very handy class to work with result records. Executing a `select` query returns Rowset instance, if `options.cursor=false`, which is default option.

## Index

#### Properties
- [isBof](#isbof)
- [isEof](#iseof)
- [length](#length)
- [fields](#fields)
- [row](#row)
- [rows](#rows)
- [rowNum](#rownum)

#### Methods
- [Rowset.prototype.get()](#rowsetprototypeget)
- [Rowset.prototype.iterator()](#rowsetprototypeiterator)
- [Rowset.prototype.moveTo()](#rowsetprototypemoveto)
- [Rowset.prototype.next()](#rowsetprototypenext)
- [Rowset.prototype.prev()](#rowsetprototypeprev)
- [Rowset.prototype.reset()](#rowsetprototypereset)
- [Rowset.prototype.seek()](#rowsetprototypeseek)
- [Rowset.prototype.set()](#rowsetprototypeset)
- [Rowset.prototype\[@@iterator\]()](#rowsetprototypeiterator)


#### Events
- [move](#moveevent)

<hr/>

## Construction

Rowset object is created when executing a query with `cursor=false` option (Default). 

***Note:*** *Rowset holds records in memory and does not keeps connection open.*

<hr/>

## Properties
        
### isBof
*getter (Boolean)*

This is a read only property that returns if `rowNum` is before first record (0).

### isEof
*getter (Boolean)*

This is a read only property that returns if `rowNum` is after last record.
    
### length
*getter (Number)*

This is a read only property that returns number of fetched record count from database.

### fields
*getter ([FieldCollection](connection/FieldCollection.md))*

This is a read only property that returns FieldCollection instance which contains information about fields.

### row
*getter (Object|Array)*

This call returns current record. If query executed with `objectRows=true` option, this property returns object that contains field name/value pairs, otherwise it returns array of values.

### rowNum
*getter/setter (Number)*

Gets and sets current row number. Note that first record number is 1.

<hr/>

## Methods

### Rowset.prototype.get()
This call returns value of given field name of current record.

`rowset.get(field)`

- `field` (String|Number) : Name or index of the field. Note that, field name is case insensitive.

- **Returns:** Value of the field.
    

```js
rowset.get('Name'); // Gets value of field "Name"
rowset.get('name'); // Gets value of field "Name"
rowset.get(0); // Gets value of field at 0
```

### Rowset.prototype.get()
This call returns value of given field name of current record.

`rowset.get(field)`

- `field` (String|Number) : Name or index of the field. Note that, field name is case insensitive.

- **Returns:** Value of the field.
    

```js
rowset.get('Name'); // Gets value of field "Name"
rowset.get('name'); // Gets value of field "Name"
rowset.get(0); // Gets value of field at 0
```


### Rowset.prototype.iterator()
This call return an Iterator object.

`rowset.iterator()`

- **Returns:** Returns an Iterator object.
    
```js
var iterator = rowset.iterator();
for (var row in iterator) {
  console.log(row);
}
```


### Rowset.prototype.next()
This call moves rowset forward by one row and return that row.

`rowset.next()`

- **Returns:** Returns next row object. If `rowNum` reaches `length`+1 (EOF) it returns undefined.
    

```js
while(rowset.next()) {
  console.log(rowset.rowNum, rowset.row.ID, rowset.row.Name);
});
```

### Rowset.prototype.prev()
This call moves rowset back by one row and return that row. 

`rowset.prev()`

- **Returns:** Returns previous row object. If `rowNum` reaches to * (BOF) it returns undefined.
    

```js
while(rowset.prev()) {
  console.log(rowset.rowNum, rowset.row.ID, rowset.row.Name);
});
```


### Rowset.prototype.reset()
This call sets `rowNum` to 0.

`rowset.reset()`


### Rowset.prototype.seek()
This call increases or decreases `rowNum` by given step.

`rowset.seek(step)`

- `step` (Number) : Number of rows that will `rowNum` move by. Negative number moves `rowNum` backward.

- **Returns:** Returns number of rows that `rowNum` move exactly. Negative value means `rowNum` moved to backward.
    

```js
rowset.step(-5);
var val = rowset.get('Name');
```

### Rowset.prototype.set()
This call updates value of given field name of current record.

**Note:** *This call only updates memory and does not make an update in database*

`rowset.get(field, value)`

- `field` (String|Number) : Name or index of the field. Note that, field name is case insensitive.
- `value` (*) : Value of the field.
    
```js
rowset.set('Name', 'John');
rowset.set('name', 'John');
rowset.set(0, 12345); 
```


### Rowset.prototype.toStream()
This call returns a readable stream.

`toStream([options])`

- `options` (Object):
    
  - `objectMode` (Boolean=false): If set true, stream will output rows as objects. If false, it will output string buffer.  
   
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

- ***Returns:*** RowsetStream.

```js
const stream = rowset.toStream();
stream.pipe(process.stdout);
```

### Rowset.prototype\[@@iterator\]()
This call returns JavaScript Iterator.

```js
var iterator = rowset[Symbol.iterator];
for (var row of iterator) {
  console.log(row);
}
```
```js
for (var row of rowset) {
  console.log(row);
}
```

<hr/>

## Events

### <a id="moveevent"></a>move

This event is called when current row number changed.

```js
rowset.on('move', (rowNum) => {
    console.log('Current row is '+ rowNum);
});
```
