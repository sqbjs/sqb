import {OpAnd} from './operators/OpAnd';
import {OpOr} from './operators/OpOr';
import {OpEq} from './operators/OpEq';
import {OpGt} from './operators/OpGt';
import {OpGte} from './operators/OpGte';
import {OpLt} from './operators/OpLt';
import {OpLte} from './operators/OpLte';
import {OpBetween} from './operators/OpBetween';
import {OpIn} from './operators/OpIn';
import {OpIs} from './operators/OpIs';
import {OpIsNot} from './operators/OpIsNot';
import {OpLike} from './operators/OpLike';
import {OpILike} from './operators/OpILike';
import {OpNe} from './operators/OpNe';
import {OpNotBetween} from './operators/OpNotBetween';
import {OpNotIn} from './operators/OpNotIn';
import {OpNotLike} from './operators/OpNotLike';
import {OpNotILike} from './operators/OpNotILike';
import {OpExists} from './operators/OpExists';
import {OpNotExists} from './operators/OpNotExists';
import {Operator} from './Operator';
import {RawStatement} from './RawStatement';
import {Serializable} from '../Serializable';
import {SelectQuery} from '../query/SelectQuery';

// Avoids circular reference
import {WrapOps} from './operators/LogicalOperator';

function And(...args: (Operator | RawStatement)[]) {
    return new OpAnd(...args);
}

function Or(...args: (Operator | RawStatement)[]) {
    return new OpOr(...args);
}

function Eq(expression: string | Serializable, value: any) {
    return new OpEq(expression, value);
}

function Ne(expression: string | Serializable, value: any) {
    return new OpNe(expression, value);
}

function Gt(expression: string | Serializable, value: any) {
    return new OpGt(expression, value);
}

function Gte(expression: string | Serializable, value: any) {
    return new OpGte(expression, value);
}

function Lt(expression: string | Serializable, value: any) {
    return new OpLt(expression, value);
}

function Lte(expression: string | Serializable, value: any) {
    return new OpLte(expression, value);
}

function Between(expression: string | Serializable, values: any[])
function Between(expression: string | Serializable, value1: any, value2: any)
function Between(expression: string | Serializable, value1: any, value2?: any) {
    const values = Array.isArray(value1) ? value1 : [value1, value2];
    return new OpBetween(expression, values);
}

function NotBetween(expression: string | Serializable, values: any[])
function NotBetween(expression: string | Serializable, value1: any, value2: any)
function NotBetween(expression: string | Serializable, value1: any, value2?: any) {
    const values = Array.isArray(value1) ? value1 : [value1, value2];
    return new OpNotBetween(expression, values);
}

function In(expression: string | Serializable, value: any) {
    return new OpIn(expression, value);
}

function NotIn(expression: string | Serializable, value: any) {
    return new OpNotIn(expression, value);
}

function Like(expression: string | Serializable, value: any) {
    return new OpLike(expression, value);
}


function NotLike(expression: string | Serializable, value: any) {
    return new OpNotLike(expression, value);
}


function Ilike(expression: string | Serializable, value: any) {
    return new OpILike(expression, value);
}


function NotILike(expression: string | Serializable, value: any) {
    return new OpNotILike(expression, value);
}

function Is(expression: string | Serializable, value: any) {
    return new OpIs(expression, value);
}

function IsNot(expression: string | Serializable, value: any) {
    return new OpIsNot(expression, value);
}

function Exists(expression: SelectQuery) {
    return new OpExists(expression);
}

function NotExists(expression: SelectQuery) {
    return new OpNotExists(expression);
}

const op = {
    and: And,
    or: Or,
    eq: Eq,
    '=': Eq,
    ne: Ne,
    '!=': Ne,
    gt: Gt,
    '>': Gt,
    gte: Gte,
    '>=': Gte,
    lt: Lt,
    '<': Lt,
    lte: Lte,
    '<=': Lte,
    between: Between,
    btw: Between,
    notBetween: NotBetween,
    nbtw: NotBetween,
    '!between': NotBetween,
    '!btw': NotBetween,
    in: In,
    notIn: NotIn,
    nin: NotIn,
    '!in': NotIn,
    like: Like,
    notLike: NotLike,
    nlike: NotLike,
    '!like': NotLike,
    ilike: Ilike,
    notILike: NotILike,
    nilike: NotILike,
    '!ilike': NotILike,
    is: Is,
    isNot: IsNot,
    '!is': IsNot,
    exists: Exists,
    notExists: NotExists,
    '!exists': NotExists
}

Object.assign(WrapOps, op);

export {op};

export {
    And,
    Or,
    Eq,
    Eq as Equal,
    Ne,
    Ne as NotEqual,
    Gt,
    Gt as GreaterThan,
    Gte,
    Gte as GreaterAnEqualTo,
    Lt,
    Lt as LowerThan,
    Lte,
    Lte as LowerAndEqualTo,
    Between,
    NotBetween,
    In,
    NotIn,
    NotIn as Nin,
    Like,
    NotLike,
    NotLike as NLike,
    Ilike,
    NotILike,
    NotILike as Nilike,
    Is,
    IsNot,
    Exists,
    NotExists
}
