import type {EntityMeta} from '../metadata/entity-meta';
import type {QueryResult} from '../..';
import {isDataColumn} from '../metadata/data-column-meta';

export async function wrapInstanceToRow(entity: EntityMeta, values: any,
                                        returning?: string[]): Promise<{
    params: any,
}> {
    const params = {};
    return {params};
    //
}

export function makeEntityInstance<T>(trg: any, ctor: Function): T {
    Object.setPrototypeOf(trg, ctor.prototype);
    return trg as T;
}

export function wrapCreateResult(
    entityDef: EntityMeta,
    values: any,
    r?: QueryResult): any {
    const row = r && r.rows && r.rows[0];
    let out;
    if (row && r && r.fields) {
        out = {};
        for (const k of entityDef.elementKeys) {
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
    return makeEntityInstance(out, entityDef.ctor);
}
