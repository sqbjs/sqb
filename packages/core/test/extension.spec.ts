import assert from 'assert';
import {registerSerializer, unRegisterSerializer, Select, SerializationType, SerializerExtension} from '@sqb/core';
import {serializers} from '../src/extensions';

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
        registerSerializer(extension1, extension2);
        assert.strictEqual(serializers.length, 2);
        assert.strictEqual(serializers[0], extension1);
        assert.strictEqual(serializers[1], extension2);
        unRegisterSerializer(extension1, extension2);
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
        registerSerializer(ext);
        const query = Select('*').addColumn().from('table1 t1');
        const result = query.generate({dialect: 'any-dialect'});
        assert.strictEqual(result.sql, 'select * from TABLE1 T1');
        unRegisterSerializer(ext);
    });

    it('should an extension can hook determining reserved words process', function () {
        const ext = {
            dialect: 'any-dialect',
            isReservedWord: (ctx, s) => {
                return s === 'hello'
            }
        };
        registerSerializer(ext);
        const query = Select('hello').addColumn().from('table1');
        const result = query.generate({dialect: 'any-dialect'});
        assert.strictEqual(result.sql, 'select "hello" from table1');
        unRegisterSerializer(ext);
    });

});
