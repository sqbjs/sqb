import {
    And,
    Count, Delete, Eq,
    Exists, In,
    Insert,
    isCompOperator,
    isLogicalOperator, LeftOuterJoin,
    LogicalOperator, Operator,
    Param,
    Raw,
    Select, Update
} from '@sqb/builder';
import {isDataColumn, isRelationColumn} from './model/ColumnDefinition';
import type {EntityDefinition} from './model/EntityDefinition';
import type {ColumnDefinition, RelationColumnDefinition} from './model/ColumnDefinition';
import type {Repository} from './Repository';
import type {PickWritable} from './orm.types';
import type {QueryExecutor, QueryResult} from '../client/types';
import {FieldInfo} from '../client/types';
import {LazyResolver} from './orm.types';

export namespace CRUD {

    /**
     *
     */


    /**
     *
     */

    /*
      Private methods
     */




}


