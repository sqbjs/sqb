import {EntityDefinition} from '../EntityDefinition';
import {EntityConfig} from '../orm.types';
import {declareEntity, getEntityDefinition} from '../helpers';

export function Entity(options?: EntityConfig | string): ClassDecorator {
    return function (target: Function) {
        const opts: EntityConfig = typeof options === 'object' ? options : {};
        const tableName = typeof options === 'string' ? options : opts.tableName;
        const entity = declareEntity(target);
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
