import './_support/env';
import assert from 'assert';
import {
    registerSerializer, unRegisterSerializer,
    Select, Param,
} from '@sqb/builder';
import {PostgresSerializer} from '../src/PostgresSerializer';

describe('PostgresSerializer', function () {

    const postgresSerializer = new PostgresSerializer();
    before(() => registerSerializer(postgresSerializer))
    after(() => unRegisterSerializer(postgresSerializer))

    it('should serialize reserved word', function() {
        const query = Select('comment').from('table1');
        const result = query.generate({dialect: 'postgres'});
        assert.strictEqual(result.sql, 'select "comment" from table1');
    });

    it('should serialize "limit"', function() {
        const query = Select().from('table1').limit(10);
        const result = query.generate({dialect: 'postgres',});
        assert.strictEqual(result.sql, 'select * from table1 LIMIT 10');
    });

    it('should serialize "offset"', function() {
        const query = Select().from('table1').offset(4);
        const result = query.generate({dialect: 'postgres',});
        assert.strictEqual(result.sql, 'select * from table1 OFFSET 4');
    });

    it('should serialize "limit" pretty print', function() {
        const query = Select().from('table1').limit(10);
        const result = query.generate({
            dialect: 'postgres',
            prettyPrint: true
        });
        assert.strictEqual(result.sql,
            'select * from table1\n' +
            'LIMIT 10');
    });

    it('should serialize "offset" pretty print', function() {
        const query = Select().from('table1').offset(10);
        const result = query.generate({
            dialect: 'postgres',
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
        const result = query.generate({dialect: 'postgres',});
        assert.strictEqual(result.sql, 'select * from table1 LIMIT 10 OFFSET 4');
    });

    it('should serialize "limit/offset" pretty print', function() {
        const query = Select()
            .from('table1')
            .offset(4)
            .limit(10);
        const result = query.generate({
            dialect: 'postgres',
            prettyPrint: true
        });
        assert.strictEqual(result.sql,
            'select * from table1\n' +
            'LIMIT 10 OFFSET 4');
    });

    it('Should serialize params', function() {
        const query = Select().from('table1').where({ID: Param('ID')});
        const result = query.generate({
            dialect: 'postgres',
            values: {ID: 5}
        });
        assert.strictEqual(result.sql, 'select * from table1 where ID = $1');
        assert.deepStrictEqual(result.params, [5]);
    });

    it('Should serialize array params for "in" operator', function() {
        const query = Select().from('table1')
            .where({'ID in': Param('id')})
            .values({id: [1, 2, 3]});
        const result = query.generate({dialect: 'postgres',});
        assert.strictEqual(result.sql, 'select * from table1 where ID = ANY($1)');
        assert.deepStrictEqual(result.params, [[1, 2, 3]]);
    });

    it('Should serialize array for "in" operator', function() {
        const query = Select().from('table1')
            .where({'ID in': [1, 2, 3]});
        const result = query.generate({
            dialect: 'postgres',
            values: {ID: 5}
        });
        assert.strictEqual(result.sql, 'select * from table1 where ID in (1,2,3)');
    });

    it('Should serialize array params for "not in" operator', function() {
        const query = Select().from('table1')
            .where({'ID !in': Param('id')})
            .values({id: [1, 2, 3]});
        const result = query.generate({dialect: 'postgres',});
        assert.strictEqual(result.sql, 'select * from table1 where ID != ANY($1)');
        assert.deepStrictEqual(result.params, [[1, 2, 3]]);
    });

    it('Should serialize array for "not in" operator', function() {
        const query = Select().from('table1')
            .where({'ID !in': [1, 2, 3]});
        const result = query.generate({dialect: 'postgres',});
        assert.strictEqual(result.sql, 'select * from table1 where ID not in (1,2,3)');
    });

    it('Should serialize "ne" operator as !=', function() {
        const query = Select().from('table1')
            .where({'ID ne': 0});
        const result = query.generate({dialect: 'postgres',});
        assert.strictEqual(result.sql, 'select * from table1 where ID != 0');
    });

});