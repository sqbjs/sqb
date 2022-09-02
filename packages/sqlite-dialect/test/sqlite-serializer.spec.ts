import {
    Param, registerSerializer, Select, unRegisterSerializer,
} from '@sqb/builder';
import {SqliteSerializer} from '../src/sqlite-serializer.js';

describe('SqliteSerializer', function () {

    const postgresSerializer = new SqliteSerializer();
    beforeAll(() => registerSerializer(postgresSerializer))
    afterAll(() => unRegisterSerializer(postgresSerializer))

    it('should serialize "limit"', function () {
        const query = Select().from('table1').limit(10);
        const result = query.generate({dialect: 'sqlite',});
        expect(result.sql).toStrictEqual('select * from table1 LIMIT 10');
    });

    it('should serialize "offset"', function () {
        const query = Select().from('table1').offset(4);
        const result = query.generate({dialect: 'sqlite',});
        expect(result.sql).toStrictEqual('select * from table1 OFFSET 4');
    });

    it('should serialize "limit" pretty print', function () {
        const query = Select().from('table1').limit(10);
        const result = query.generate({
            dialect: 'sqlite',
            prettyPrint: true
        });
        expect(result.sql).toStrictEqual(
            'select * from table1\n' +
            'LIMIT 10');
    });

    it('should serialize "offset" pretty print', function () {
        const query = Select().from('table1').offset(10);
        const result = query.generate({
            dialect: 'sqlite',
            prettyPrint: true
        });
        expect(result.sql).toStrictEqual(
            'select * from table1\n' +
            'OFFSET 10');
    });

    it('should serialize "limit/offset"', function () {
        const query = Select()
            .from('table1')
            .offset(4)
            .limit(10);
        const result = query.generate({dialect: 'sqlite'});
        expect(result.sql).toStrictEqual('select * from table1 LIMIT 10 OFFSET 4');
    });

    it('should serialize "limit/offset" pretty print', function () {
        const query = Select()
            .from('table1')
            .offset(4)
            .limit(10);
        const result = query.generate({
            dialect: 'sqlite',
            prettyPrint: true
        });
        expect(result.sql).toStrictEqual(
            'select * from table1\n' +
            'LIMIT 10 OFFSET 4');
    });

    it('Should serialize params', function () {
        const query = Select().from('table1').where({ID: Param('ID')});
        const result = query.generate({
            dialect: 'sqlite',
            params: {ID: 5}
        });
        expect(result.sql).toStrictEqual('select * from table1 where ID = :ID');
        expect(result.params).toStrictEqual({ID: 5});
    });

});
