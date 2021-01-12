import {And, Delete, LogicalOperator} from '@sqb/builder';
import {QueryExecutor} from '../../client/types';
import {EntityDefinition} from '../EntityDefinition';
import {Repository} from '../Repository';
import SearchFilter = Repository.SearchFilter;
import {prepareFilter} from './filter.helper';

export async function destroyAll(args: {
    executor: QueryExecutor;
    entityDef: EntityDefinition;
    filter?: SearchFilter;
    params?: any;
}): Promise<number> {
    const {executor, entityDef, filter, params} = args;

    let where: LogicalOperator | undefined;
    if (filter) {
        where = And();
        await prepareFilter(entityDef, filter, where);
    }
    const query = Delete(entityDef.tableName + ' T');
    if (where)
        query.where(...where._items);
    // Execute query
    const resp = await executor.execute(query, {
        values: params,
        objectRows: false,
        cursor: false,
    });
    return (resp && resp.rowsAffected) || 0;
}
