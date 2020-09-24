export enum ParamType {
    COLON,
    QUESTION_MARK,
    DOLLAR,
    AT
}

export enum JoinType {
    INNER,
    LEFT,
    LEFT_OUTER,
    RIGHT,
    RIGHT_OUTER,
    OUTER,
    FULL_OUTER
}

export enum SerializationType {
    SELECT_QUERY = 'select_query',
    INSERT_QUERY = 'insert_query',
    UPDATE_QUERY = 'update_query',
    DELETE_QUERY = 'delete_query',
    SELECT_COLUMN = 'select_column',
    GROUP_COLUMN = 'group_column',
    ORDER_COLUMN = 'order_column',
    TABLE_NAME = 'table_name',
    JOIN = 'join',
    JOIN_CONDITIONS = 'join_conditions',
    RAW = 'raw',
    CASE_EXPRESSION = 'case_expression',
    COMPARISON_EXPRESSION = 'comparison_expression',
    LOGICAL_EXPRESSION = 'logical_expression'
}

export enum OperatorType {
    and = 'and',
    or = 'or',
    eq = 'eq',
    ne = 'ne',
    gt = 'gt',
    gte = 'gte',
    lt = 'lt',
    lte = 'lte',
    between = 'between',
    notBetween = 'notBetween',
    in = 'in',
    notIn = 'notIn',
    like = 'like',
    notLike = 'nlike',
    iLike = 'iLike',
    notILike = 'nIlike',
    is = 'is',
    isNot = 'isNot',
    exists = 'exists',
    notExists = 'notExists'
}
