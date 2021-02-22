import {EntityMeta} from '../metadata/entity-meta';
import {isDataColumn} from '../metadata/data-column-meta';

export function extractKeyValues<T>(
    entityDef: EntityMeta,
    valueOrInstance: any | Record<string, any> | T): Record<string, any> {
    const primaryIndex = entityDef.primaryIndex;
    if (!primaryIndex)
        throw new Error(`No primary fields defined for "${entityDef.name}" entity`);

    const validateCol = (k) => {
        const col = entityDef.getColumn(k);
        if (!col)
            throw new Error(`Unknown column (${k}) defined as primary key in entity "${entityDef.name}"`);
        if (!isDataColumn(col))
            throw new Error(`Column (${k}) defined as primary key in entity "${entityDef.name}" is not a data column`);
    }

    // if entities primary key has more than one key field
    if (primaryIndex.columns.length > 1) {
        if (typeof valueOrInstance !== 'object')
            throw new Error(`"${entityDef.name}" entity` +
                ` has more than one primary key field and you must provide all values with an key/value pair`);

        const valueKeys = Object.keys(valueOrInstance);
        const valueKeysUpper = valueKeys.map(x => x.toUpperCase());

        const out: Record<string, any> = {};
        for (const k of primaryIndex.columns) {
            const i = valueKeysUpper.indexOf(k.toUpperCase());
            if (i < 0)
                throw new Error(`Value of key field "${entityDef.name}.${k}" required to perform this operation`);
            validateCol(k);
            out[k] = valueOrInstance[valueKeys[i]];
        }
        return out;
    }

    const primaryColumnName = primaryIndex.columns[0];
    validateCol(primaryColumnName);
    if (typeof valueOrInstance === 'object') {
        const valueKeys = Object.keys(valueOrInstance);
        const valueKeysUpper = valueKeys.map(x => x.toUpperCase());
        const i = valueKeysUpper.indexOf(primaryColumnName.toUpperCase());
        if (i < 0)
            throw new Error(`Value of key field "${entityDef.name}.${primaryColumnName}" required to perform this operation`);
        return {[primaryColumnName]: valueOrInstance[valueKeys[i]]};
    }

    return {[primaryColumnName]: valueOrInstance};
}
