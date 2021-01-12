import {ColumnConfig} from '../orm.types';
import {EntityDefinition} from '../EntityDefinition';

export function Column(options?: string | ColumnConfig): PropertyDecorator {
    return (target: Object, propertyKey: string | symbol): void => {
        if (typeof propertyKey !== 'string')
            throw new Error('You can define a Column for only string properties');
        const entity = EntityDefinition.attach(target.constructor);
        const opts = typeof options === 'string' ?
            {type: options} : options;
        const col = entity.addDataColumn(propertyKey);
        if (opts) {
            if (opts.fieldName)
                col.fieldName = opts.fieldName || entity.name;
            if (opts.type)
                col.type = opts.type;
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
            if (opts.sortAscending != null)
                col.sortAscending = opts.sortAscending;
            if (opts.sortDescending != null)
                col.sortDescending = opts.sortDescending;
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
