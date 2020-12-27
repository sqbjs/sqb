import {Insert} from '@sqb/builder';
import {EntityDefinition} from '../../model/EntityDefinition';
import {QueryExecutor} from '../../../client/types';
import {Constructor, InsertOptions, WritableKeys} from '../../orm.types';
import {getEntityDefinition} from '../../helpers';
import {isDataColumn} from '../../model/ColumnDefinition';
import {Maybe} from '../../../types';

export class InsertTask<T> {

    entityDef: EntityDefinition;

    constructor(public executor: QueryExecutor,
                public ctor: Constructor) {
        this.entityDef = getEntityDefinition(ctor);
    }

    async execute(instance: WritableKeys<T>, options?: InsertOptions): Promise<Maybe<T>> {
        const values = {};
        const returning: string[] = [];
        let v;
        for (const col of this.entityDef.columns.values()) {
            v = instance[col.name];
            if (isDataColumn(col)) {
                if (col.autoGenerate)
                    returning.push(col.fieldName + '::' + col.dataType);
                if (!(col.insert == null || col.insert))
                    continue;
                values[col.fieldName] = v;
            }
        }
        const query = Insert(this.entityDef.tableName, values);
        query.returning()
        const r = await this.executor.execute(query);
        return {} as T;
    }

}
