import 'reflect-metadata';

export {Type, Maybe, DeepPartial, DeepPickWritable, DeepBuildable} from 'ts-gems';
export * from './types.js';

export * from './client/types.js';
export * from './client/adapter.js';
export * from './client/sqb-client.js';
export * from './client/sqb-connection.js';
export * from './client/cursor.js';
export {
    registerAdapter,
    unRegisterAdapter
} from './client/extensions.js';

export * from './orm/orm.type.js';
export * from './orm/orm.const.js';
export * from './orm/base-entity.js';
export * from './orm/repository.class.js';

export * from './orm/model/entity-metadata.js';
export * from './orm/model/element-metadata.js';
export * from './orm/model/column-element-metadata.js';
export * from './orm/model/embedded-element-metadata.js';
export * from './orm/model/association-element-metadata.js';
export * from './orm/model/association.js';
export * from './orm/model/association-node.js';
export * from './orm/model/index-metadata.js';
export * from './orm/model/link-chain.js';

export * from './orm/decorators/column.decorator.js';
export * from './orm/decorators/embedded.decorator.js';
export * from './orm/decorators/entity.decorator.js';
export * from './orm/decorators/events.decorator.js';
export * from './orm/decorators/foreignkey.decorator.js';
export * from './orm/decorators/index.decorator.js';
export * from './orm/decorators/link.decorator.js';
export * from './orm/decorators/primarykey.decorator.js';
export * from './orm/decorators/transform.decorator.js';

export {
    isColumnElement,
    isEmbeddedElement,
    isAssociationElement,
    isEntityClass
} from './orm/util/orm.helper.js';

export * from './orm/backward.js';
