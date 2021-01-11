import type {EntityDefinition} from '../model/EntityDefinition';
import type {QueryResult} from '../../client/types';
import {isDataColumn} from '../model/ColumnDefinition';

export function wrapCreateResult(
    entityDef: EntityDefinition,
    values: any,
    r?: QueryResult): any {
    const row = r && r.rows && r.rows[0];
    if (!row)
        return values;
    if (row && r && r.fields) {
        const out = {};
        for (const k of entityDef.columnKeys) {
            const col = entityDef.getColumn(k);
            if (!col)
                continue;
            const f = isDataColumn(col) && r.fields.get(col.fieldName);
            if (f)
                out[k] = row[f.index];
            else if (values[k] !== undefined)
                out[k] = values[k];
        }
        return out;
    }
    throw new Error('Unexpected response returned from adapter');
}
