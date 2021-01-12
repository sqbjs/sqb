import type {EntityDefinition} from '../EntityDefinition';
import type {QueryResult} from '../../client/types';
import {isDataColumn} from '../ColumnDefinition';

export function wrapCreateResult(
    entityDef: EntityDefinition,
    values: any,
    r?: QueryResult): any {
    const row = r && r.rows && r.rows[0];
    let out;
    if (row && r && r.fields) {
        out = {};
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
    } else out = {...values};
    Object.setPrototypeOf(out, entityDef.ctor.prototype);
    return out;
}
