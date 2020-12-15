import {ColumnConfig} from '../types';
import {EntityDefinition} from '../definition/EntityDefinition';

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
            if (opts.defaultValue !== undefined)
                col.defaultValue = opts.defaultValue;
            if (opts.isArray !== undefined)
                col.isArray = opts.isArray;
            if (opts.comment !== undefined)
                col.comment = opts.comment;
            if (opts.collation !== undefined)
                col.collation = opts?.collation;
            if (opts.nullable !== undefined)
                col.nullable = opts?.nullable;
            if (opts.enum !== undefined)
                col.enum = opts?.enum;
            if (opts.length !== undefined)
                col.length = opts?.length;
            if (opts.precision !== undefined)
                col.precision = opts?.precision;
            if (opts.scale !== undefined)
                col.scale = opts?.scale;
            if (opts.autoGenerate !== undefined)
                col.autoGenerate = opts?.autoGenerate;
        }
    }
}
