import './_support/env';
import assert from 'assert';
import {
    registerSerializer, unRegisterSerializer,
    Select, Param, Update,
} from '@sqb/builder';
import {PostgresSerializer} from '../src/PostgresSerializer';

describe('PostgresSerializer', function () {

    const postgresSerializer = new PostgresSerializer();
    before(() => registerSerializer(postgresSerializer))
    after(() => unRegisterSerializer(postgresSerializer))

    it('should serialize reserved word', function () {
        const query = Select('comment').from('table1');
        const result = query.generate({dialect: 'postgres'});
        assert.strictEqual(result.sql, 'select "comment" from table1');
    });

    it('should serialize "limit"', function () {
        const query = Select().from('table1').limit(10);
        const result = query.generate({dialect: 'postgres',});
        assert.strictEqual(result.sql, 'select * from table1 LIMIT 10');
    });

    it('should serialize "offset"', function () {
        const query = Select().from('table1').offset(4);
        const result = query.generate({dialect: 'postgres',});
        assert.strictEqual(result.sql, 'select * from table1 OFFSET 4');
    });

    it('should serialize "limit" pretty print', function () {
        const query = Select().from('table1').limit(10);
        const result = query.generate({
            dialect: 'postgres',
            prettyPrint: true
        });
        assert.strictEqual(result.sql,
            'select * from table1\n' +
            'LIMIT 10');
    });

    it('should serialize "offset" pretty print', function () {
        const query = Select().from('table1').offset(10);
        const result = query.generate({
            dialect: 'postgres',
            prettyPrint: true
        });
        assert.strictEqual(result.sql,
            'select * from table1\n' +
            'OFFSET 10');
    });

    it('should serialize "limit/offset"', function () {
        const query = Select()
            .from('table1')
            .offset(4)
            .limit(10);
        const result = query.generate({dialect: 'postgres',});
        assert.strictEqual(result.sql, 'select * from table1 LIMIT 10 OFFSET 4');
    });

    it('should serialize "limit/offset" pretty print', function () {
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

    it('Should serialize params', function () {
        const query = Select().from('table1').where({ID: Param('ID')});
        const result = query.generate({
            dialect: 'postgres',
            params: {ID: 5}
        });
        assert.strictEqual(result.sql, 'select * from table1 where ID = $1');
        assert.deepStrictEqual(result.params, [5]);
    });

    it('Should compare array params using "in" operator', function () {
        const query = Select().from('table1')
            .where({'ID in': Param('id')})
            .values({id: [1, 2, 3]});
        const result = query.generate({dialect: 'postgres',});
        assert.strictEqual(result.sql, 'select * from table1 where ID = ANY($1)');
        assert.deepStrictEqual(result.params, [[1, 2, 3]]);
    });

    it('Should compare array value using "in" operator', function () {
        const query = Select().from('table1')
            .where({'ID in': [1, 2, 3]});
        const result = query.generate({
            dialect: 'postgres',
            params: {ID: 5}
        });
        assert.strictEqual(result.sql, 'select * from table1 where ID in (1,2,3)');
    });

    it('Should serialize array params for "not in" operator', function () {
        const query = Select().from('table1')
            .where({'ID !in': Param('id')})
            .values({id: [1, 2, 3]});
        const result = query.generate({dialect: 'postgres',});
        assert.strictEqual(result.sql, 'select * from table1 where ID != ANY($1)');
        assert.deepStrictEqual(result.params, [[1, 2, 3]]);
    });

    it('Should compare array using "not in" operator', function () {
        const query = Select().from('table1')
            .where({'ID !in': [1, 2, 3]});
        const result = query.generate({dialect: 'postgres',});
        assert.strictEqual(result.sql, 'select * from table1 where ID not in (1,2,3)');
    });

    it('Should serialize "ne" operator as !=', function () {
        const query = Select().from('table1')
            .where({'ID ne': 0});
        const result = query.generate({dialect: 'postgres',});
        assert.strictEqual(result.sql, 'select * from table1 where ID != 0');
    });

    it('Should compare if both expression and value is array', function () {
        const query = Select().from('table1')
            .where({'ids[] in': Param('ids')})
            .values({ids: [1, 2, 3]});
        const result = query.generate({dialect: 'postgres',});
        assert.strictEqual(result.sql, 'select * from table1 where ids && ANY($1)');
        assert.deepStrictEqual(result.params, [[1, 2, 3]]);
    });

    it('Should compare if expression is array and but value', function () {
        const query = Select().from('table1')
            .where({'ids[] in': Param('id')})
            .values({id: 1});
        const result = query.generate({dialect: 'postgres',});
        assert.strictEqual(result.sql, 'select * from table1 where $1 = ANY(ids)');
        assert.deepStrictEqual(result.params, [1]);
    });

    it('Should serialize update returning query', function () {
        const query = Update('table1', {id: 1})
            .returning('id');
        const result = query.generate({dialect: 'postgres',});
        assert.strictEqual(result.sql, 'update table1 set id = 1 returning id');
        assert.deepStrictEqual(result.returningFields, [{field: 'id', alias: undefined}]);
    });

});
