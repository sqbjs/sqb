import 'reflect-metadata';
export {Type, Maybe, DeepPartial, DeepPickWritable, DeepBuildable} from 'ts-gems';
export * from './types';

export * from './client/types';
export * from './client/Adapter';
export * from './client/SqbClient';
export * from './client/SqbConnection';
export * from './client/Cursor';
export {registerAdapter, unRegisterAdapter} from './client/extensions';

export * from './orm/orm.type';

export * from './orm/interfaces/element-metadata';
export * from './orm/interfaces/column-element-metadata';
export * from './orm/interfaces/complex-element-metadata';
export * from './orm/interfaces/association-element-metadata';

export * from './orm/base-entity.class';
export * from './orm/decorators/entity.decorator';
export * from './orm/decorators/primarykey.decorator';
export * from './orm/decorators/index.decorator';
export * from './orm/decorators/column.decorator';
export * from './orm/decorators/link.decorator';
export * from './orm/decorators/embedded.decorator';
export * from './orm/decorators/foreignkey.decorator';
export * from './orm/decorators/events.decorator';
export * from './orm/decorators/transform.decorator';

export * from './orm/repository.class';
export * from './orm/model/entity-model';
export * from './orm/model/association';
export * from './orm/model/index-meta';

export * from './orm/util/entity-mapping';

export {isColumnElement, isObjectElement, isAssociationElement, isEntityClass} from './orm/util/orm.helper';
