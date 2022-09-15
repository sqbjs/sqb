export enum JoinType {
    INNER = 'inner',
    LEFT = 'left',
    LEFT_OUTER = 'left outer',
    RIGHT = 'right',
    RIGHT_OUTER = 'right outer',
    OUTER = 'outer',
    FULL_OUTER = 'full outer'
}

export enum SerializationType {
    SELECT_QUERY = 'select_query',
    SELECT_QUERY_COLUMNS = 'select_query.columns',
    SELECT_QUERY_FROM = 'select_query.from',
    SELECT_QUERY_JOIN = 'select_query.join',
    SELECT_QUERY_GROUPBY = 'select_query.groupby',
    SELECT_QUERY_ORDERBY = 'select_query.orderby',
    INSERT_QUERY = 'insert_query',
    INSERT_QUERY_COLUMNS = 'insert_query.columns',
    INSERT_QUERY_VALUES = 'insert_query.values',
    UPDATE_QUERY = 'update_query',
    UPDATE_QUERY_VALUES = 'update_query.values',
    DELETE_QUERY = 'delete_query',
    FIELD_NAME = 'field_name',
    GROUP_COLUMN = 'group_column',
    ORDER_COLUMN = 'order_column',
    RETURNING_COLUMN = 'returning_column',
    TABLE_NAME = 'table_name',
    JOIN = 'join',
    JOIN_CONDITIONS = 'join_conditions',
    RAW = 'raw',
    CASE_STATEMENT = 'case_expression',
    COALESCE_STATEMENT = 'coalesce_expression',
    LOWER_STATEMENT = 'lower_expression',
    UPPER_STATEMENT = 'upper_expression',
    MAX_STATEMENT = 'max_expression',
    MIN_STATEMENT = 'min_expression',
    SEQUENCE_GETTER_STATEMENT = 'sequence_getter_statement',
    STRINGAGG_STATEMENT = 'StringAGG_expression',
    COUNT_STATEMENT = 'count_expression',
    CONDITIONS_BLOCK = 'conditions_block',
    COMPARISON_EXPRESSION = 'comparison_expression',
    LOGICAL_EXPRESSION = 'logical_expression',
    RETURNING_BLOCK = 'returning_block',
    DATE_VALUE = 'date_value',
    STRING_VALUE = 'string_value',
    BOOLEAN_VALUE = 'boolean_value',
    NUMBER_VALUE = 'number_value',
    EXTERNAL_PARAMETER = 'external_parameter',
    ARRAY = 'array',
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
    notLike = 'notLike',
    iLike = 'iLike',
    notILike = 'notILike',
    is = 'is',
    isNot = 'isNot',
    exists = 'exists',
    notExists = 'notExists'
}

export enum DataType {
    BOOL = 'BOOL',
    CHAR = 'CHAR',
    VARCHAR = 'VARCHAR',
    SMALLINT = 'SMALLINT',
    INTEGER = 'INTEGER',
    BIGINT = 'BIGINT',
    FLOAT = 'FLOAT',
    DOUBLE = 'DOUBLE',
    NUMBER = 'NUMBER',
    DATE = 'DATE',
    TIMESTAMP = 'TIMESTAMP',
    TIMESTAMPTZ = 'TIMESTAMPTZ',
    TIME = 'TIME',
    BINARY = 'BINARY',
    TEXT = 'TEXT',
    GUID = 'GUID',
    JSON = 'JSON'
}
