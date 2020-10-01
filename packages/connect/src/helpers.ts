import {camelCase, pascalCase} from "putil-varhelpers";
import {
    ArrayRow,
    ArrayRowset,
    CoercionFunction,
    FieldInfo, FieldNaming, ObjectRow, ObjectRowset,
    PreparedQuery
} from './types';
import {Adapter} from './Adapter';
import {FieldInfoMap} from './FieldInfoMap';

export function applyNamingStrategy(fieldName: string, namingStrategy?: FieldNaming): string {
    if (typeof namingStrategy === 'string') {
        switch (namingStrategy.toLowerCase()) {
            case 'lowercase':
                return fieldName.toLowerCase();
            case 'uppercase':
                return fieldName.toUpperCase();
            case 'camelcase':
                if (!fieldName.match(/[a-z]/))
                    return camelCase(fieldName.toLowerCase());
                fieldName = camelCase(fieldName);
                return fieldName[0].toLowerCase() + fieldName.substring(1);
            case 'pascalcase':
                if (!fieldName.match(/[a-z]/))
                    return pascalCase(fieldName.toLowerCase());
                return pascalCase(fieldName);
        }
    } else if (typeof namingStrategy === 'function')
        return namingStrategy(fieldName);
    return fieldName;
}

export function normalizeFieldMap(oldFields: Record<string, Adapter.FieldInfo> | Adapter.FieldInfo[],
                                  fieldNaming?: FieldNaming): FieldInfoMap {

    const mapFieldInfo = (f: Adapter.FieldInfo, index: number): FieldInfo => {
        const n = applyNamingStrategy(f.name, fieldNaming);
        const x: FieldInfo = {...f, fieldName: f.name, index};
        if (n !== x.name) {
            x.name = n;
            x.fieldName = f.name;
        }
        return x;
    };
    const result = new FieldInfoMap();
    if (Array.isArray(oldFields)) {
        oldFields.forEach((f, index) => {
            const x = mapFieldInfo(f, index);
            result.add(x);
        });
    } else {
        let i = 0;
        for (const [k, f] of Object.entries(oldFields)) {
            f.name = k;
            const x = mapFieldInfo(f, i++);
            result.add(x);
        }
    }
    return result;
}

export function normalizeRows(fields: FieldInfoMap, rowType: 'array' | 'object',
                              oldRows: ObjectRowset | ArrayRowset,
                              options: Pick<PreparedQuery, 'objectRows' | 'ignoreNulls' | 'coercion'>
): Record<string, any>[] | any[][] {

    const ignoreNulls = options.ignoreNulls && options.objectRows;
    const coercion = options.coercion;
    const coerceValue: CoercionFunction = (v: any, f?: FieldInfo): any => {
        if (v === undefined)
            return;
        if (coercion)
            v = coercion(v, f);
        if (v === null && ignoreNulls)
            return;
        return v;
    };

    if (options.objectRows) {
        if (rowType === 'array') {
            return (oldRows as ArrayRowset).map((row: ArrayRow) => {
                const r = {};
                for (const f of fields.values()) {
                    const v = coerceValue(row[f.index], f);
                    if (v !== undefined)
                        r[f.name] = v;
                }
                return r;
            }) as ObjectRowset;
        }

        let hasFieldNaming = false;
        for (const f of fields.values()) {
            if (f.name !== f.fieldName) {
                hasFieldNaming = true;
                break;
            }
        }

        if (hasFieldNaming || coercion) {
            return (oldRows as ObjectRowset).map((row: ObjectRow) => {
                const r = {};
                for (const f of fields.values()) {
                    const v = coerceValue(row[f.fieldName], f);
                    if (v !== undefined)
                        r[f.name] = v;
                }
                return r;
            }) as ObjectRowset;
        }

        if (ignoreNulls) {
            oldRows.forEach(row => {
                for (const [k, v] of Object.entries(row)) {
                    if (v === null)
                        delete row[k];
                }
            });
        }

        return oldRows;
    }

    if (rowType === 'array') {
        (oldRows as ArrayRowset).forEach((row: ArrayRow) => {
            for (const [i, v] of row.entries()) {
                row[i] = coerceValue(v, fields.get(i));
            }
        });
        return oldRows;
    }

    return (oldRows as ObjectRowset).map((row: ObjectRow) => {
        const r = [] as ArrayRow;
        for (const f of fields.values()) {
            r[f.index] = coerceValue(row[f.fieldName], f);
        }
        return r;
    }) as ArrayRowset

}

export function callFetchHooks(rows: ObjectRowset | ArrayRowset, prepared: PreparedQuery): void {
    const fetchHooks = prepared.fetchHooks;
    if (!fetchHooks)
        return;
    for (const row of rows) {
        for (const fn of fetchHooks) {
            fn(row, prepared);
        }
    }
}

