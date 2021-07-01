import './_support/env';
import assert from 'assert';
import {
    registerSerializer, unRegisterSerializer,
    Select, Param,
} from '@sqb/builder';
import {SqliteSerializer} from '../src/SqliteSerializer';

describe('SqliteSerializer', function () {

    const postgresSerializer = new SqliteSerializer();
    before(() => registerSerializer(postgresSerializer))
    after(() => unRegisterSerializer(postgresSerializer))

    it('should serialize "limit"', function() {
        const query = Select().from('table1').limit(10);
        const result = query.generate({dialect: 'sqlite',});
        assert.strictEqual(result.sql, 'select * from table1 LIMIT 10');
    });

    it('should serialize "offset"', function() {
        const query = Select().from('table1').offset(4);
        const result = query.generate({dialect: 'sqlite',});
        assert.strictEqual(result.sql, 'select * from table1 OFFSET 4');
    });

    it('should serialize "limit" pretty print', function() {
        const query = Select().from('table1').limit(10);
        const result = query.generate({
            dialect: 'sqlite',
            prettyPrint: true
        });
        assert.strictEqual(result.sql,
            'select * from table1\n' +
            'LIMIT 10');
    });

    it('should serialize "offset" pretty print', function() {
        const query = Select().from('table1').offset(10);
        const result = query.generate({
            dialect: 'sqlite',
            prettyPrint: true
        });
        assert.strictEqual(result.sql,
            'select * from table1\n' +
            'OFFSET 10');
    });

    it('should serialize "limit/offset"', function() {
        const query = Select()
            .from('table1')
            .offset(4)
            .limit(10);
        const result = query.generate({dialect: 'sqlite'});
        assert.strictEqual(result.sql, 'select * from table1 LIMIT 10 OFFSET 4');
    });

    it('should serialize "limit/offset" pretty print', function() {
        const query = Select()
            .from('table1')
            .offset(4)
            .limit(10);
        const result = query.generate({
            dialect: 'sqlite',
            prettyPrint: true
        });
        assert.strictEqual(result.sql,
            'select * from table1\n' +
            'LIMIT 10 OFFSET 4');
    });

    it('Should serialize params', function() {
        const query = Select().from('table1').where({ID: Param('ID')});
        const result = query.generate({
            dialect: 'sqlite',
            values: {ID: 5}
        });
        assert.strictEqual(result.sql, 'select * from table1 where ID = :ID');
        assert.deepStrictEqual(result.values, {ID: 5});
    });

});
