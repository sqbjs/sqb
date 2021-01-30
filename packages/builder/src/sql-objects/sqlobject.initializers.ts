import {DataType, JoinType} from '../enums';
import {Serializable} from '../Serializable';
import {SelectQuery} from '../query/SelectQuery';
import {InsertQuery} from '../query/InsertQuery';
import {UpdateQuery} from '../query/UpdateQuery';
import {DeleteQuery} from '../query/DeleteQuery';
import {RawStatement} from './RawStatement';
import {JoinStatement} from './JoinStatement';
import {CaseStatement} from './CaseStatement';
import {CountStatement} from './CountStatement';
import {ParamExpression} from './ParamExpression';

export function Raw(text: string): RawStatement {
    return new RawStatement(text);
}

export function Select(...column: (string | string[] | Serializable)[]): SelectQuery {
    return new SelectQuery(...column);
}

export function Insert(tableName: string | RawStatement, input): InsertQuery {
    return new InsertQuery(tableName, input);
}

export function Update(tableName: string | RawStatement, input): UpdateQuery {
    return new UpdateQuery(tableName, input);
}

export function Delete(tableName: string | RawStatement): DeleteQuery {
    return new DeleteQuery(tableName);
}

export function Join(table: string | SelectQuery | RawStatement): JoinStatement {
    return new JoinStatement(JoinType.INNER, table);
}

export function InnerJoin(table: string | SelectQuery | RawStatement): JoinStatement {
    return new JoinStatement(JoinType.INNER, table);
}

export function LeftJoin(table: string | SelectQuery | RawStatement): JoinStatement {
    return new JoinStatement(JoinType.LEFT, table);
}

export function LeftOuterJoin(table: string | SelectQuery | RawStatement): JoinStatement {
    return new JoinStatement(JoinType.LEFT_OUTER, table);
}

export function RightJoin(table: string | SelectQuery | RawStatement): JoinStatement {
    return new JoinStatement(JoinType.RIGHT, table);
}

export function RightOuterJoin(table: string | SelectQuery | RawStatement): JoinStatement {
    return new JoinStatement(JoinType.RIGHT_OUTER, table);
}

export function OuterJoin(table: string | SelectQuery | RawStatement): JoinStatement {
    return new JoinStatement(JoinType.OUTER, table);
}

export function FullOuterJoin(table: string | SelectQuery | RawStatement): JoinStatement {
    return new JoinStatement(JoinType.FULL_OUTER, table);
}

export function Case(): CaseStatement {
    return new CaseStatement();
}

export function Count(): CountStatement {
    return new CountStatement();
}

export function Param(arg: string | { name: string, dataType?: DataType, isArray?: boolean }): ParamExpression {
    return new ParamExpression(arg);
}
