import {EntityModel} from '../model/entity-model';
import {EntityConfig} from '../orm.type';

export function Entity(options?: EntityConfig | string): ClassDecorator {
    return function (target: Function) {
        const opts: EntityConfig = typeof options === 'object' ? options : {};
        const tableName = typeof options === 'string' ? options : opts.tableName;
        const entity = EntityModel.attachTo(target);
        entity.tableName = tableName || target.name;
        if (opts.schema)
            entity.schema = opts.schema;
        if (opts.comment)
            entity.comment = opts.comment;
    };
}

export namespace Entity {
    export function getMetadata(ctor: Function): EntityModel | undefined {
        return EntityModel.get(ctor);
    }
}
