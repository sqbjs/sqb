# Transactions

The queries and raw statements can be run within transactions. To do that a single connection can be obtained from the database pool. 

**Important! :** When the Connection is no longer needed, it must be closed.

```js
db.connect((err, connection) => {
    connection
        .select('current_date')
        .execute((err, result) => {
            if (err) {
              connection.close();
              return;
            )
            const dt = result.rows[0][0];
            return connection.execute(
                'insert into table1(the_date) values(:dt)',{dt}),
                (err, result) => {
                    if (err) {
                        connection.close();
                        return;
                    )
                    console.log('Inserted new row');
                    connection.commit(()=>connection.close());              
            }
        );        
    })
});
```


### Avoiding callback hell
NodeJS callback model very useful in some ways. But if we talk about large async code blocks, you can fall in to a callback hell and can miss closing the connection. SQB has a few functionality to avoid this. In the situations below, SQB automatically rollbacks the transaction and closes the connection.

 **1.** If any error throwes within connect callback. This applies to both formal and async functions.
  
```js
db.connect((err, connection) => {
        throw new Error("sfdf");
});
db.connect(async (err, connection) => {
        throw new Error("sfdf");
});
```

**2.** If any returned value from connect callback is a Promise and the promise is rejected.
  
```js
// Return a single promise
db.connect((err, connection) => {
       return connection
        .select('invalid sql here').then();
});
// or a promise chain
db.connect((err, connection) => {
       return connection
        .select('current_date sql here')
        .then(() => {
           return connection.execute('invalid sql here').execute();
        });
});
```

### Using async/await functionality
SQB supports async/await functionality of ES7/ES2016. The example below shows how to use it in SQB.

```js
db.connect(async (err, connection) => {
    let result = await connection
        .select('current_date')
        .execute();        
     const dt = result.rows[0][0];
     await connection
        .execute('insert into table1(the_date) '+
        'values(:dt)', {dt});       
     console.log('Inserted new row');
     await connection.commit();
     await connection.close();                  
});
```
