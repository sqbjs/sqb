import {And, Count, LogicalOperator, Select} from '@sqb/builder';
import {prepareFilter} from '../util/prepare-filter';
import {QueryExecutor} from '../../';
import {EntityMeta} from '../metadata/entity-meta';
import {Repository} from '../repository';

export type CountCommandArgs = {
    entity: EntityMeta;
    connection: QueryExecutor;
} & Repository.CountOptions;

export class CountCommand {

    // istanbul ignore next
    protected constructor() {
        throw new Error('This class is abstract');
    }

    static async execute(args: CountCommandArgs): Promise<number> {
        const {connection, entity, filter, params} = args;
        let where: LogicalOperator | undefined;
        if (filter) {
            where = And();
            await prepareFilter(entity, filter, where, 'T');
        }
        const query = Select(Count()).from(entity.tableName + ' T');
        if (where)
            query.where(where);
        // Execute query
        const resp = await connection.execute(query, {
            params,
            objectRows: false,
            cursor: false,
        });
        return (resp && resp.rows && resp.rows[0][0]) || 0;
    }
}
