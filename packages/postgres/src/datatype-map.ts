import { DataTypeOIDs, OID } from 'postgresql-client';
import { DataType } from '@sqb/builder';

export function dataTypeToOID(dataType: DataType, isArray?: boolean): OID | undefined {
  if (dataType === DataType.DATE)
    return isArray ? DataTypeOIDs._date : DataTypeOIDs.date;
  if (dataType === DataType.BOOL)
    return isArray ? DataTypeOIDs._bool : DataTypeOIDs.bool;
  if (dataType === DataType.CHAR)
    return isArray ? DataTypeOIDs._bpchar : DataTypeOIDs.bpchar;
  if (dataType === DataType.SMALLINT)
    return isArray ? DataTypeOIDs._int2 : DataTypeOIDs.int2;
  if (dataType === DataType.INTEGER)
    return isArray ? DataTypeOIDs._int4 : DataTypeOIDs.int4;
  if (dataType === DataType.BIGINT)
    return isArray ? DataTypeOIDs._int8 : DataTypeOIDs.int8;
  if (dataType === DataType.BINARY)
    return isArray ? DataTypeOIDs._bytea : DataTypeOIDs.bytea;
  if (dataType === DataType.FLOAT)
    return isArray ? DataTypeOIDs._float4 : DataTypeOIDs.float4;
  if (dataType === DataType.DOUBLE)
    return isArray ? DataTypeOIDs._float8 : DataTypeOIDs.float8;
  if (dataType === DataType.GUID)
    return isArray ? DataTypeOIDs._uuid : DataTypeOIDs.uuid;
  if (dataType === DataType.TEXT)
    return isArray ? DataTypeOIDs._text : DataTypeOIDs.text;
  if (dataType === DataType.JSON)
    return isArray ? DataTypeOIDs._json : DataTypeOIDs.json;
}
