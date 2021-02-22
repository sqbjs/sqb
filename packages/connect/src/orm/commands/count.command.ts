import {And, Count, LogicalOperator, Select} from '@sqb/builder';
import {prepareFilter} from './filter.helper';
import {QueryExecutor} from '../../';
import {EntityMeta} from '../metadata/entity-meta';
import {Repository} from '../repository';

export type CountCommandArgs = {
    executor: QueryExecutor;
    entityDef: EntityMeta;
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
        params,
        objectRows: false,
        cursor: false,
    });
    return (resp && resp.rows && resp.rows[0][0]) || 0;
}
