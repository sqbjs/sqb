import {EntityMeta} from '../metadata/entity-meta';
import {isDataColumn} from '../metadata/data-column-meta';

const SORT_ORDER_PATTERN = /^([-+])?(.*)$/;

export async function prepareSort(entityDef: EntityMeta, sort: string[]) {
    const orderColumns: string[] = [];
    for (const item of sort) {
        const m = item.match(SORT_ORDER_PATTERN);
        if (!m)
            throw new Error(`"${item}" is not a valid order expression`);

        let elName = m[2];
        let prefix = '';
        let suffix = '';
        if (elName.includes('.')) {
            const a: string[] = elName.split('.');
            while (a.length > 1) {
                const col = entityDef.getEmbeddedColumn(a.shift() || '');
                if (!col)
                    throw new Error(`Invalid column (${elName}) declared in sort property`);
                entityDef = await col.resolveType();
                if (col.fieldNamePrefix)
                    prefix += col.fieldNamePrefix;
                if (col.fieldNameSuffix)
                    suffix = col.fieldNameSuffix + suffix;
            }
            elName = a.shift() || '';
        }
        const col = entityDef.getElement(elName);
        if (!col)
            throw new Error(`Unknown element (${elName}) declared in sort property`);
        if (!isDataColumn(col))
            throw new Error(`Can not sort by "${elName}", because it is not a data column`);

        const dir = m[1] || '+';
        orderColumns.push((dir || '') + prefix + col.fieldName + suffix);
    }
    return orderColumns;
}
