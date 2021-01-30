import {ColumnConfig} from '../orm.types';
import {DataType} from '../..';
import {declareColumn} from '../helpers';

export function Column(options?: DataType | ColumnConfig): PropertyDecorator {
    return (target: Object, propertyKey: string | symbol): void => {
        if (typeof propertyKey !== 'string')
            throw new Error('You can define a Column for only string properties');
        const opts = typeof options === 'string' ?
            {dataType: options} : options;
        const col = declareColumn(target, propertyKey);
        if (opts) {
            if (opts.fieldName)
                col.fieldName = opts.fieldName;
            if (opts.type) {
                col.type = opts.type;
                if (col.type === Boolean)
                    col.dataType = DataType.BOOL;
                else if (col.type === String)
                    col.dataType = DataType.VARCHAR;
                else if (col.type === Number)
                    col.dataType = DataType.NUMBER;
                else if (col.type === Date)
                    col.dataType = DataType.TIMESTAMP;
                else if (col.type === Array) {
                    col.dataType = DataType.VARCHAR;
                    col.isArray = true;
                } else if (col.type === Buffer)
                    col.dataType = DataType.BINARY;
            }
            if (opts.dataType)
                col.dataType = opts.dataType;
            if (opts.defaultValue != null)
                col.defaultValue = opts.defaultValue;
            if (opts.isArray != null)
                col.isArray = opts.isArray;
            if (opts.comment != null)
                col.comment = opts.comment;
            if (opts.collation != null)
                col.collation = opts.collation;
            if (opts.nullable != null)
                col.nullable = opts.nullable;
            if (opts.enum != null)
                col.enum = opts.enum;
            if (opts.length != null)
                col.length = opts.length;
            if (opts.precision != null)
                col.precision = opts.precision;
            if (opts.scale != null)
                col.scale = opts.scale;
            if (opts.autoGenerate != null)
                col.autoGenerate = opts.autoGenerate;
            if (opts.required != null)
                col.required = opts.required;
            if (opts.required != null)
                col.required = opts.required;
            if (opts.hidden != null)
                col.hidden = opts.hidden;
            if (opts.update != null)
                col.update = opts.update;
            if (opts.insert != null)
                col.insert = opts.insert;
        }
    }
}
