import {EntityMeta} from '../metadata/entity-meta';
import {EntityConfig} from '../types';

export function Entity(options?: EntityConfig | string): ClassDecorator {
    return function (target: Function) {
        const opts: EntityConfig = typeof options === 'object' ? options : {};
        const tableName = typeof options === 'string' ? options : opts.tableName;
        const entity = EntityMeta.attachTo(target);
        entity.tableName = tableName || target.name;
        if (opts.schema)
            entity.schema = opts.schema;
        if (opts.comment)
            entity.comment = opts.comment;
    };
}

export namespace Entity {
    export function getMetadata(ctor: Function): EntityMeta {
        return EntityMeta.get(ctor);
    }
}
