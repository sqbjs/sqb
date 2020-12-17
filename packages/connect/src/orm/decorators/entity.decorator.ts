import {EntityDefinition} from '../definition/EntityDefinition';
import {EntityConfig} from '../types';
import {getEntityDefinition} from '../helpers';

export function Entity(options?: EntityConfig | string): ClassDecorator {
    return function (target: Function) {
        const opts: EntityConfig = typeof options === 'object' ? options : {};
        const tableName = typeof options === 'string' ? options : opts.tableName;
        const entity = EntityDefinition.attach(target as Function);
        if (tableName)
            entity.tableName = tableName;
        if (opts.schema)
            entity.schema = opts.schema;
        if (opts.comment)
            entity.comment = opts.comment;
    };
}

export namespace Entity {
    export function getMetadata(ctor: Function): EntityDefinition {
        return getEntityDefinition(ctor);
    }
}
