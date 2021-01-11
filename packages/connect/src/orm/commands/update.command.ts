import {Param, Update} from '@sqb/builder';
import {QueryExecutor, QueryResult} from '../../client/types';
import {isDataColumn} from '../model/ColumnDefinition';
import {EntityDefinition} from '../model/EntityDefinition';
import {PickWritable} from '../orm.types';
import {extractKeyValues} from './keyvalues.helper';
import {wrapCreateResult} from './wrap-result.helper';
import {Repository} from '../Repository';

export type UpdateAllCommandArgs<T> = {
    executor: QueryExecutor;
    entityDef: EntityDefinition;
    values: Partial<PickWritable<T>>;
    returnAutoGeneratedColumns?: boolean;
} & Repository.UpdateAllOptions;

export async function updateAllRaw<T>(args: UpdateAllCommandArgs<T>): Promise<QueryResult | undefined> {
    const {entityDef, executor, values, filter, params, returnAutoGeneratedColumns} = args;
    const input = {};
    const _params = {...params};
    const returning: string[] | undefined = returnAutoGeneratedColumns ? [] : undefined;
    let v;
    let i = 0;

    for (const col of entityDef.columns.values()) {
        if (isDataColumn(col)) {
            if (returning && col.autoGenerate && col.canUpdate)
                returning.push(col.fieldName);
            v = values[col.name];
            if (v === undefined || col.update === false)
                continue;
            i++;
            input[col.fieldName] = Param('$input_' + col.fieldName);
            _params['$input_' + col.fieldName] = v;
        }
        if (i === 0)
            return;
    }
    const query = Update(entityDef.tableName, input)
        .where(filter);
    if (returning && returning.length)
        query.returning(...returning);
    return await executor.execute(query, {
        values: _params,
        objectRows: false,
        cursor: false
    });
}

export async function update<T>(args: {
    executor: QueryExecutor,
    entityDef: EntityDefinition,
    values: Partial<PickWritable<T>>,
    returnAutoGeneratedColumns?: boolean
}): Promise<T | undefined> {
    const {executor, entityDef, values, returnAutoGeneratedColumns} = args;

    // Key values are used to filter records, so we remove them from values
    const keyValues = extractKeyValues<T>(entityDef, values);
    const _values = {};
    for (const k of Object.keys(values)) {
        const col = entityDef.getColumn(k);
        if (col && !keyValues.hasOwnProperty(col.name))
            _values[k] = values[k];
    }

    const filter = {};
    for (const k of Object.keys(keyValues)) {
        filter[k] = Param(k);
    }

    const r = await updateAllRaw({
        executor,
        entityDef,
        values: _values,
        filter,
        params: keyValues,
        returnAutoGeneratedColumns
    });
    return r && r.rowsAffected ?
        wrapCreateResult(entityDef, values, r) : undefined;
}
