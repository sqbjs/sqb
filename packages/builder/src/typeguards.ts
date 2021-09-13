import {SerializationType} from './enums';
import {Serializable} from './Serializable';
import type {SelectQuery} from './query/SelectQuery';
import type {InsertQuery} from './query/InsertQuery';
import type {UpdateQuery} from './query/UpdateQuery';
import type {DeleteQuery} from './query/DeleteQuery';
import type {RawStatement} from './sql-objects/RawStatement';
import type {JoinStatement} from './sql-objects/JoinStatement';
import type {CaseStatement} from './sql-objects/CaseStatement';
import type {ParamExpression} from './sql-objects/ParamExpression';
import type {LogicalOperator} from './sql-objects/operators/LogicalOperator';
import type {CompOperator} from './sql-objects/operators/CompOperator';
import type {FieldExpression} from './sql-objects/FieldExpression';
import type {OrderColumn} from './sql-objects/OrderColumn';
import type {GroupColumn} from './sql-objects/GroupColumn';
import type {ReturningColumn} from './sql-objects/ReturningColumn';
import type {TableName} from './sql-objects/TableName';
import {CountStatement} from './sql-objects/CountStatement';

export function isSerializable(value: any): value is Serializable {
    return value instanceof Serializable;
}

export function isRawStatement(value: any): value is RawStatement {
    return isSerializable(value) && value._type === SerializationType.RAW;
}

export function isSelectQuery(value: any): value is SelectQuery {
    return isSerializable(value) && value._type === SerializationType.SELECT_QUERY;
}

export function isInsertQuery(value: any): value is InsertQuery {
    return isSerializable(value) && value._type === SerializationType.INSERT_QUERY;
}

export function isIUpdateQuery(value: any): value is UpdateQuery {
    return isSerializable(value) && value._type === SerializationType.UPDATE_QUERY;
}

export function isDeleteQuery(value: any): value is DeleteQuery {
    return isSerializable(value) && value._type === SerializationType.DELETE_QUERY;
}

export function isJoinStatement(value: any): value is JoinStatement {
    return isSerializable(value) && value._type === SerializationType.JOIN;
}

export function isCaseStatement(value: any): value is CaseStatement {
    return isSerializable(value) && value._type === SerializationType.CASE_STATEMENT;
}

export function isCountStatement(value: any): value is CountStatement {
    return isSerializable(value) && value._type === SerializationType.COUNT_STATEMENT;
}

export function isParamExpression(value: any): value is ParamExpression {
    return isSerializable(value) && value._type === SerializationType.EXTERNAL_PARAMETER;
}

export function isLogicalOperator(value: any): value is LogicalOperator {
    return isSerializable(value) && value._type === SerializationType.LOGICAL_EXPRESSION;
}

export function isCompOperator(value: any): value is CompOperator {
    return isSerializable(value) && value._type === SerializationType.COMPARISON_EXPRESSION;
}

export function isSelectColumn(value: any): value is FieldExpression {
    return isSerializable(value) && value._type === SerializationType.SELECT_COLUMN;
}

export function isOrderColumn(value: any): value is OrderColumn {
    return isSerializable(value) && value._type === SerializationType.ORDER_COLUMN;
}

export function isGroupColumn(value: any): value is GroupColumn {
    return isSerializable(value) && value._type === SerializationType.GROUP_COLUMN;
}

export function isReturningColumn(value: any): value is ReturningColumn {
    return isSerializable(value) && value._type === SerializationType.RETURNING_COLUMN;
}

export function isTableName(value: any): value is TableName {
    return isSerializable(value) && value._type === SerializationType.TABLE_NAME;
}

