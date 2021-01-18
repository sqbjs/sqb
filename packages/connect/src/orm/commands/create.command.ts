import {Insert, Param} from '@sqb/builder';
import {QueryExecutor, QueryResult} from '../../client/types';
import {isDataColumn} from '../ColumnDefinition';
import {wrapCreateResult} from './wrap-result.helper';
import {EntityDefinition} from '../EntityDefinition';
import {PickWritable} from '../orm.types';

export interface CreateCommandArgs<T> {
    executor: QueryExecutor;
    entityDef: EntityDefinition;
    values: Partial<PickWritable<T>>;
    returnAutoGeneratedColumns?: boolean;
}

/**
 *
 */
export async function createRaw<T>(args: CreateCommandArgs<T>): Promise<QueryResult> {
    const {executor, entityDef, values, returnAutoGeneratedColumns} = args;
    const input = {};
    const params = {};
    const returning: string[] | undefined = returnAutoGeneratedColumns ? [] : undefined;
    let v;
    for (const col of entityDef.columns.values()) {
        if (isDataColumn(col)) {
            v = values[col.name];
            if (returning && col.autoGenerate && col.canInsert)
                returning.push(col.fieldName);
            if (typeof col.transformWrite === 'function')
                v = col.transformWrite(v, col, values);
            if (v === undefined || col.insert === false)
                continue;
            input[col.fieldName] = Param(col.fieldName);
            params[col.fieldName] = v;
        }
    }
    const query = Insert(entityDef.tableName, input);
    if (returning && returning.length)
        query.returning(...returning);
    return await executor.execute(query, {
        params,
        objectRows: false,
        cursor: false
    });
}

/**
 *
 */
export async function create<T>(args: CreateCommandArgs<T>): Promise<T> {
    const {entityDef, values} = args;
    const r = await createRaw(args);
    return wrapCreateResult(entityDef, values, r);
}
