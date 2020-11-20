import './_support/env';
import assert from 'assert';
import {
    registerSerializer, unRegisterSerializer,
    Select, Param,
} from '@sqb/builder';
import {MSSqlSerializer} from '../src/MSSqlSerializer';

describe('MSSqlSerializer', function () {

    const mssqlSerializer = new MSSqlSerializer();
    before(() => registerSerializer(mssqlSerializer))
    after(() => unRegisterSerializer(mssqlSerializer))

    it('should serialize "limit"', function () {
        const query = Select().from('table1').as('t1').limit(10);
        const result = query.generate({dialect: 'mssql'});
        assert.strictEqual(result.sql, 'select * from table1 FETCH NEXT 10 ROWS ONLY');
    });

    it('should serialize "limit" pretty print', function () {
        const query = Select().from('table1').as('t1').limit(10);
        const result = query.generate({dialect: 'mssql', prettyPrint: true});
        assert.strictEqual(result.sql,
            'select * from table1\n' +
            'FETCH NEXT 10 ROWS ONLY');
    });

    it('should serialize "limit/offset"', function () {
        const query = Select()
            .from('table1')
            .offset(4)
            .limit(10);
        const result = query.generate({
            dialect: 'mssql',
            prettyPrint: true
        });
        assert.strictEqual(result.sql, 'select * from table1\n' +
            'OFFSET 4 ROWS FETCH NEXT 10 ROWS ONLY');
    });

    it('should serialize "limit/offset" pretty print', function () {
        const query = Select()
            .from('table1')
            .offset(4)
            .limit(10);
        const result = query.generate({
            dialect: 'mssql',
            prettyPrint: true
        });
        assert.strictEqual(result.sql,
            'select * from table1\n' +
            'OFFSET 4 ROWS FETCH NEXT 10 ROWS ONLY');
    });

    it('Should serialize params', function () {
        const query = Select().from('table1').where({'ID': Param('ID')});
        const result = query.generate({
            dialect: 'mssql',
            values: {ID: 5}
        });
        assert.strictEqual(result.sql, 'select * from table1 where ID = @ID');
        assert.deepStrictEqual(result.params, {ID: 5});
    });

});
