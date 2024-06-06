import { serializers } from '../src/extensions.js';
import {
  registerSerializer,
  Select,
  SerializationType,
  SerializerExtension,
  unRegisterSerializer,
} from '../src/index.js';

describe('Serializer Extensions', function () {
  it('should register serialization extension', () => {
    const oldLen = serializers.length;
    const extension1: SerializerExtension = {
      dialect: 'any-dialect',
      serialize: () => '',
    };
    const extension2: SerializerExtension = {
      dialect: 'any-dialect',
      isReservedWord: () => true,
    };
    registerSerializer(extension1, extension2);
    expect(serializers.length).toStrictEqual(oldLen + 2);
    expect(serializers[oldLen]).toStrictEqual(extension1);
    expect(serializers[oldLen + 1]).toStrictEqual(extension2);
    unRegisterSerializer(extension1, extension2);
  });

  it('should an extension hook serialization process', function () {
    const ext = {
      dialect: 'any-dialect',
      serialize: (ctx, type, obj) => {
        if (type === SerializationType.TABLE_NAME) return obj.table.toUpperCase() + ' ' + obj.alias.toUpperCase();
      },
    };
    registerSerializer(ext);
    const query = Select('*').addColumn().from('table1 t1');
    const result = query.generate({ dialect: 'any-dialect' });
    expect(result.sql).toStrictEqual('select * from TABLE1 T1');
    unRegisterSerializer(ext);
  });

  it('should an extension can hook determining reserved words process', function () {
    const ext = {
      dialect: 'any-dialect',
      isReservedWord: (ctx, s) => {
        return s === 'hello';
      },
    };
    registerSerializer(ext);
    const query = Select('hello').addColumn().from('table1');
    const result = query.generate({ dialect: 'any-dialect' });
    expect(result.sql).toStrictEqual('select "hello" from table1');
    unRegisterSerializer(ext);
  });
});
