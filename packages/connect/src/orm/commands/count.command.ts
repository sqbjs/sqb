import {And, Count, LogicalOperator, Select} from '@sqb/builder';
import {prepareFilter} from './filter.helper';
import {QueryExecutor} from '../../client/types';
import {EntityDefinition} from '../EntityDefinition';
import {Repository} from '../Repository';

export type CountCommandArgs = {
    executor: QueryExecutor;
    entityDef: EntityDefinition;
} & Repository.CountOptions;

export async function count(args: CountCommandArgs): Promise<number> {
    const {executor, entityDef, filter, params} = args;
    let where: LogicalOperator | undefined;
    if (filter) {
        where = And();
        await prepareFilter(entityDef, filter, where, 'T');
    }
    const query = Select(Count()).from(entityDef.tableName + ' T');
    if (where)
        query.where(where);
    // Execute query
    const resp = await executor.execute(query, {
        values: params,
        objectRows: false,
        cursor: false,
    });
    return (resp && resp.rows && resp.rows[0][0]) || 0;
}
