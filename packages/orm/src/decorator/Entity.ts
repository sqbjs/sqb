import {EntityOptions} from '../types';
import {Schema} from '../database-model/Schema';

export function Entity(options?: EntityOptions): ClassDecorator;
export function Entity(name?: string, options?: EntityOptions): ClassDecorator;
export function Entity(arg0?: any, arg1?: any): ClassDecorator {
    return function (target) {
        let name = '';
        let options: EntityOptions;
        if (typeof arg0 === 'string') {
            name = arg0;
            options = arg1 || {};
        } else {
            options = arg0 || {};
        }
        if (options.name)
            name = options.name;

        Schema.getOrInit()

        getMetadataArgsStorage().tables.push({
            target: target,
            name: name,
            type: "regular",
            orderBy: options.orderBy ? options.orderBy : undefined,
            engine: options.engine ? options.engine : undefined,
            database: options.database ? options.database : undefined,
            schema: options.schema ? options.schema : undefined,
            synchronize: options.synchronize,
            withoutRowid: options.withoutRowid
        } as TableMetadataArgs);
    };
}
