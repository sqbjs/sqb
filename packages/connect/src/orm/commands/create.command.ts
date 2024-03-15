import { Insert, Param } from '@sqb/builder';
import { SqbConnection } from '../../client/sqb-connection.js';
import { ColumnFieldMetadata } from '../model/column-field-metadata.js';
import { EmbeddedFieldMetadata } from '../model/embedded-field-metadata.js';
import { EntityMetadata } from '../model/entity-metadata.js';
import { isColumnField, isEmbeddedField } from '../util/orm.helper.js';

export type CreateCommandArgs = {
  entity: EntityMetadata;
  connection: SqbConnection;
  values: any;
  returning?: boolean;
}

type CreateCommandContext = {
  entity: EntityMetadata;
  queryParams: any;
  queryValues: any;
  colCount: number;
}

export class CreateCommand {

  // istanbul ignore next
  protected constructor() {
    throw new Error('This class is abstract');
  }

  static async execute(args: CreateCommandArgs): Promise<any> {
    const {entity} = args;
    const tableName = entity.tableName;
    if (!tableName)
      throw new Error(`${entity.ctor.name} is not decorated with @Entity decorator`);

    // Create a context
    const ctx: CreateCommandContext = {
      entity,
      queryParams: {},
      queryValues: {},
      colCount: 0
    }

    // Prepare
    await this._prepareParams(ctx, entity, args.values);
    if (!ctx.colCount)
      throw new Error('No field given to create new entity instance');

    const query = Insert(tableName, ctx.queryValues);
    if (args.returning) {
      const primaryIndexColumns = EntityMetadata.getPrimaryIndexColumns(entity);
      if (primaryIndexColumns.length)
        query.returning(...primaryIndexColumns.map(col => col.fieldName));
    }


    const qr = await args.connection.execute(query, {
      params: ctx.queryParams,
      objectRows: false,
      cursor: false
    });

    if (args.returning && qr.fields && qr.rows?.length) {
      const keyValues = {};
      for (const f of qr.fields.values()) {
        const el = EntityMetadata.getColumnFieldByFieldName(entity, f.fieldName);
        if (el)
          keyValues[el.name] = qr.rows[0][f.index];
      }
      return keyValues;
    }
  }

  protected static async _prepareParams(
      ctx: CreateCommandContext,
      entity: EntityMetadata,
      values: any,
      prefix?: string,
      suffix?: string
  ) {
    let v;
    prefix = prefix || '';
    suffix = suffix || '';
    for (const col of Object.values(entity.fields)) {
      v = values[col.name];
      if (isColumnField(col)) {
        if (col.noInsert)
          continue;
        if (v == null && col.default !== undefined) {
          v = typeof col.default === 'function' ?
              col.default(values) : col.default;
        }
        if (typeof col.serialize === 'function')
          v = col.serialize(v, col.name);
        if (v == null) {
          if (col.notNull && !col.autoGenerated)
            throw new Error(`${entity.name}.${col.name} is required and can't be null`);
          continue;
        }
        ColumnFieldMetadata.checkEnumValue(col, v);
        const fieldName = prefix + col.fieldName + suffix;
        const k = '$input_' + fieldName;
        ctx.queryValues[fieldName] = Param({
          name: k,
          dataType: col.dataType,
          isArray: col.isArray
        });
        ctx.queryParams[k] = v;
        ctx.colCount++;
      } else if (v != null && isEmbeddedField(col)) {
        const type = await EmbeddedFieldMetadata.resolveType(col);
        await this._prepareParams(ctx, type, v, col.fieldNamePrefix, col.fieldNameSuffix);
      }
    }
  }

}
