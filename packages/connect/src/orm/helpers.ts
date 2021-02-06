import 'reflect-metadata';
import {EntityDefinition} from './EntityDefinition';
import {Constructor} from './orm.types';
import {ENTITY_DEFINITION_KEY} from './consts';
import {ColumnDefinition, isDataColumn} from './ColumnDefinition';
import {DataType} from '../client/types';

const padZero = (n: number): string => (n < 9 ? '0' : '') + n;

export function isClass(fn: any): fn is Constructor {
    return typeof fn === 'function' && /^\s*class/.test(fn.toString());
}

export function isEntityClass(fn: any): fn is Constructor {
    return !!(isClass(fn) && fn[ENTITY_DEFINITION_KEY]);
}

export function getEntityDefinition(fn: Function): EntityDefinition {
    return fn[ENTITY_DEFINITION_KEY];
}

export function declareEntity(ctor: Function): EntityDefinition {
    let entity: EntityDefinition = EntityDefinition.get(ctor);
    if (entity)
        return entity;
    ctor[ENTITY_DEFINITION_KEY] = entity = new EntityDefinition(ctor as Constructor);
    // Merge base entity columns into this one
    const baseCtor = Object.getPrototypeOf(ctor);
    const baseDef = EntityDefinition.get(baseCtor);
    if (baseDef) {
        for (const k of baseDef.columnKeys) {
            const colDef = baseDef.columns.get(k.toUpperCase());
            if (colDef) {
                entity.columnKeys.push(k);
                entity.columns.set(k.toUpperCase(), colDef);
            }
        }
    }
    if (baseDef.primaryIndex) {
        entity.primaryIndex = {
            column: baseDef.primaryIndex.column,
            unique: true
        }
    }
    ctor.prototype.toJSON = function (): Object {
        const obj = {};
        const columnKeys = entity.columnKeys;
        const l = columnKeys.length;
        let key;
        let v;
        for (let i = 0; i < l; i++) {
            key = columnKeys[i]
            v = this[key];
            if (v === undefined)
                continue;
            const col = entity.getColumn(key);
            if (col)
                obj[key] = convertValue(col, v);
        }
        return obj;
    }
    return entity;
}

function convertValue(col: ColumnDefinition, v: any): any {
    if (isDataColumn(col)) {
        if (col.isArray) {
            if (Array.isArray(v))
                return v.map(x => convertDataValue(col.dataType || DataType.VARCHAR, x));
            return [convertDataValue(col.dataType || DataType.VARCHAR, v)];
        }
        return convertDataValue(col.dataType || DataType.VARCHAR, v);
    }
    if (typeof v === 'object' && typeof v.toJSON === 'function')
        return v.toJSON();

    return v;
}

function convertDataValue(dataType: DataType, v: any): any {
    if (v == null)
        return;
    if (v instanceof Date &&
        (dataType === DataType.DATE || dataType === DataType.TIMESTAMP)) {
        return v.getFullYear() + '-' +
            padZero(v.getMonth() + 1) + '-' +
            padZero(v.getDate()) + (
                dataType === DataType.TIMESTAMP ?
                    'T' + padZero(v.getHours()) + ':' +
                    padZero(v.getMinutes()) + ':' +
                    padZero(v.getSeconds()) : '');
    }
    if (v instanceof Buffer)
        return v.toString('base64');

    if (typeof v === 'number' && (
        dataType === DataType.SMALLINT ||
        dataType === DataType.INTEGER)
    ) return Math.trunc(v);

    if (typeof v === 'bigint')
        return v.toString();

    if (v && typeof v === 'object' && typeof v.toJSON === 'function')
        return v.toJSON();

    return v;
}
