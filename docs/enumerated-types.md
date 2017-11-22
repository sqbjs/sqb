# Enumerated Types

## JoinType

SQB namespace, Pool and Connection classes exposes JoinType.

`sqb.JoinType`

`Pool.prototype.JoinType`

`Connection.prototype.JoinType`


JoinType (Number):

- INNER: 0
- LEFT: 1
- LEFT_OUTER: 2
- RIGHT: 3
- RIGHT_OUTER: 4
- OUTER: 5
- FULL_OUTER: 6


## ParamType

SQB namespace, Pool and Connection classes exposes ParamType.

`sqb.ParamType`

`Pool.prototype.ParamType`

`Connection.prototype.ParamType`


ParamType (Number):

- COLON: 0
- QUESTION_MARK: 1
- DOLLAR: 2

## PoolState

SQB namespace and Pool classes exposes PoolState.

`sqb.PoolState`

`Pool.prototype.PoolState`

PoolState (Number):

- IDLE: 0 // Pool has not been started
- STARTED: 1 // Pool has been started
- STOPPING: 2 // Pool shutdown in progress
- STOPPED: 3 // Pool has been shut down
