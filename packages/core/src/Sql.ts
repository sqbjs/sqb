import {JoinType} from './enums';
import {Serializable} from './Serializable';
import {SelectQuery} from './query/SelectQuery';
import {InsertQuery} from './query/InsertQuery';
import {UpdateQuery} from './query/UpdateQuery';
import {DeleteQuery} from './query/DeleteQuery';
import {RawStatement} from './sql-objects/RawStatement';
import {JoinStatement} from './sql-objects/JoinStatement';
import {CaseStatement} from './sql-objects/CaseStatement';

function Raw(text: string): RawStatement {
    return new RawStatement(text);
}

function Select(...column: (string | string[] | Serializable)[]): SelectQuery {
    return new SelectQuery(...column);
}

function Insert(tableName: string | RawStatement, input): InsertQuery {
    return new InsertQuery(tableName, input);
}

function Update(tableName: string | RawStatement, input): UpdateQuery {
    return new UpdateQuery(tableName, input);
}

function Delete(tableName: string | RawStatement): DeleteQuery {
    return new DeleteQuery(tableName);
}

function Join(table: string | SelectQuery | RawStatement): JoinStatement {
    return new JoinStatement(JoinType.INNER, table);
}

function InnerJoin(table: string | SelectQuery | RawStatement): JoinStatement {
    return new JoinStatement(JoinType.INNER, table);
}

function LeftJoin(table: string | SelectQuery | RawStatement): JoinStatement {
    return new JoinStatement(JoinType.LEFT, table);
}

function LeftOuterJoin(table: string | SelectQuery | RawStatement): JoinStatement {
    return new JoinStatement(JoinType.LEFT_OUTER, table);
}

function RightJoin(table: string | SelectQuery | RawStatement): JoinStatement {
    return new JoinStatement(JoinType.RIGHT, table);
}

function RightOuterJoin(table: string | SelectQuery | RawStatement): JoinStatement {
    return new JoinStatement(JoinType.RIGHT_OUTER, table);
}

function OuterJoin(table: string | SelectQuery | RawStatement): JoinStatement {
    return new JoinStatement(JoinType.OUTER, table);
}

function FullOuterJoin(table: string | SelectQuery | RawStatement): JoinStatement {
    return new JoinStatement(JoinType.FULL_OUTER, table);
}

function Case(): CaseStatement {
    return new CaseStatement();
}

export {
    Select,
    Insert,
    Update,
    Delete,
    Raw,
    Join,
    InnerJoin,
    LeftJoin,
    LeftOuterJoin,
    RightJoin,
    RightOuterJoin,
    OuterJoin,
    FullOuterJoin,
    Case
}
