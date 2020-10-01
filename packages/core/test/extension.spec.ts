import assert from 'assert';
import {Extension, Select, SerializationType, SerializerExtension} from '@sqb/core';

describe('Serializer Extensions', function () {

    it('should register serialization extension', () => {
        const extension1: SerializerExtension = {
            dialect: 'any-dialect',
            serialize: () => ''
        }
        const extension2: SerializerExtension = {
            dialect: 'any-dialect',
            isReservedWord: () => true
        }
        Extension.registerSerializer(extension1, extension2);
        assert.strictEqual(Extension.serializers.length, 2);
        assert.strictEqual(Extension.serializers[0], extension1);
        assert.strictEqual(Extension.serializers[1], extension2);
        Extension.unRegisterSerializer(extension1, extension2);
    });

    it('should an extension hook serialization process', function () {
        const ext = {
            dialect: 'any-dialect',
            serialize: (ctx, type, obj) => {
                if (type === SerializationType.TABLE_NAME)
                    return obj.table.toUpperCase() +
                        ' ' + obj.alias.toUpperCase();
            }
        };
        Extension.registerSerializer(ext);
        const query = Select('*').addColumn().from('table1 t1');
        const result = query.generate({dialect: 'any-dialect'});
        assert.strictEqual(result.sql, 'select * from TABLE1 T1');
        Extension.unRegisterSerializer(ext);
    });

    it('should an extension can hook determining reserved words process', function () {
        const ext = {
            dialect: 'any-dialect',
            isReservedWord: (ctx, s) => {
                return s === 'hello'
            }
        };
        Extension.registerSerializer(ext);
        const query = Select('hello').addColumn().from('table1');
        const result = query.generate({dialect: 'any-dialect'});
        assert.strictEqual(result.sql, 'select "hello" from table1');
        Extension.unRegisterSerializer(ext);
    });

});
