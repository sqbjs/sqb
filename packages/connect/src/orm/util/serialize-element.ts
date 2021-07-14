import {DataType} from '@sqb/builder';
import {AbstractEntityelement} from '../model/abstract-entityelement';
import {isColumnElement} from './orm.helper';

export function serializeColumn(col: AbstractEntityelement, v: any): any {
    if (isColumnElement(col)) {
        if (col.isArray) {
            if (Array.isArray(v))
                return v.map(x => serializeDataValue(col.dataType || DataType.VARCHAR, x));
            return [serializeDataValue(col.dataType || DataType.VARCHAR, v)];
        }
        return serializeDataValue(col.dataType || DataType.VARCHAR, v);
    }
    if (typeof v === 'object' && typeof v.toJSON === 'function')
        return v.toJSON();

    return v;
}

const padZero = (n: number): string => (n < 9 ? '0' : '') + n;

function serializeDataValue(dataType: DataType, v: any): any {
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
