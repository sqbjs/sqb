import {And, Count, LogicalOperator, Select} from '@sqb/builder';
import {prepareFilter} from './command.helper';
import {QueryExecutor} from '../../';
import {EntityModel} from '../model/entity-model';
import {Repository} from '../repository.class';

export type CountCommandArgs = {
    entity: EntityModel;
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
