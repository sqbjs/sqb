import _ from 'lodash';
import { DataType } from '@sqb/builder';
import type {
  ColumnAutoGenerationStrategy,
  ColumnTransformFunction,
  DefaultValueGetter,
  EnumValue,
  FieldValue,
} from '../orm.type.js';
import type { EntityMetadata } from './entity-metadata.js';
import { FieldMetadata } from './field-metadata.js';

export type ColumnFieldOptions = Partial<Omit<ColumnFieldMetadata, 'entity' | 'name' | 'kind'>>;

export interface ColumnFieldMetadata extends FieldMetadata {
  readonly kind: 'column';

  /**
   Name of table field
   */
  fieldName: string;

  /**
   JS type. String, Boolean, Person etc
   */
  type?: Function;

  /**
   * Column data type
   */
  dataType?: DataType;

  /**
   * Field comment
   */
  comment?: string;

  /**
   * Column's default value
   */
  default?: FieldValue | DefaultValueGetter;

  /**
   * Indicates if column data is an array
   */
  isArray?: boolean;

  /**
   * Indicates enum values
   */
  enum?: EnumValue;

  /**
   * Character or byte length of column
   */
  length?: number;

  /**
   * The precision for a decimal field
   */
  precision?: number;

  /**
   * The scale for a decimal field
   */
  scale?: number;

  /**
   * Fields's collation.
   */
  collation?: string;

  /**
   * Indicates auto generation strategy
   */
  autoGenerated?: ColumnAutoGenerationStrategy;

  /**
   * Indicates if column value can be null
   */
  notNull?: boolean;

  /**
   * Indicates if column value is used in update queries
   */
  noUpdate?: boolean;

  /**
   * Indicates if column value is used in insert queries
   */
  noInsert?: boolean;

  parse?: ColumnTransformFunction;
  serialize?: ColumnTransformFunction;
}

export namespace ColumnFieldMetadata {
  export function create(entity: EntityMetadata, name: string, options: ColumnFieldOptions = {}): ColumnFieldMetadata {
    const result: ColumnFieldMetadata = {
      kind: 'column',
      entity,
      name,
      fieldName: name,
    };
    if (options) ColumnFieldMetadata.assign(result, options);
    return result;
  }

  export function assign(target: ColumnFieldMetadata, options: ColumnFieldOptions) {
    Object.assign(target, _.omit(options, ['entity', 'name', 'kind']));
  }

  export function checkEnumValue(col: ColumnFieldMetadata, v: FieldValue) {
    if (v === undefined || !col.enum || (v == null && !col.notNull)) return;
    const enumKeys = Array.isArray(col.enum) ? col.enum : Object.keys(col.enum);
    if (!enumKeys.includes(v)) throw new Error(`${col.entity.name}.${col.name} value must be one of (${enumKeys})`);
  }
}
