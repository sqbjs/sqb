import {DataType, JoinType} from './enums';
import {Serializable} from './Serializable';
import {SelectQuery} from './query/SelectQuery';
import {InsertQuery} from './query/InsertQuery';
import {UpdateQuery} from './query/UpdateQuery';
import {DeleteQuery} from './query/DeleteQuery';
import {RawStatement} from './sql-objects/RawStatement';
import {JoinStatement} from './sql-objects/JoinStatement';
import {CaseStatement} from './sql-objects/CaseStatement';
import {CountStatement} from './sql-objects/CountStatement';
import {ParamExpression} from './sql-objects/ParamExpression';
import {FieldExpression} from './sql-objects/FieldExpression';

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

export function Param(name: string, dataType?: DataType, isArray?: boolean): ParamExpression
export function Param(args: { name: string, dataType?: DataType, isArray?: boolean }): ParamExpression
export function Param(arg0: any, arg1?: any, arg2?: any): ParamExpression {
    if (typeof arg0 === 'object')
        return new ParamExpression(arg0);
    return new ParamExpression({
        name: arg0,
        dataType: arg1,
        isArray: arg2
    });
}

export function Field(name: string, dataType?: DataType, isArray?: boolean): FieldExpression
export function Field(args: { name: string, dataType?: DataType, isArray?: boolean }): FieldExpression
export function Field(arg0: any, arg1?: any, arg2?: any): FieldExpression {
    if (typeof arg0 === 'object')
        return new FieldExpression(arg0);
    return new FieldExpression(arg0, arg1, arg2);
}
