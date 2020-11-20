import './_support/env';
import assert from 'assert';
import {
    registerSerializer, unRegisterSerializer,
    Select, Eq, Insert, Param
} from '@sqb/builder';
import {OracleSerializer} from '../src/OracleSerializer';

describe('OracleSerializer', function () {

    const oracleSerializer = new OracleSerializer();
    before(() => registerSerializer(oracleSerializer))
    after(() => unRegisterSerializer(oracleSerializer))

    describe('all versions', function () {
        it('should use dual when no table given', function () {
            const query = Select().from();
            const result = query.generate({dialect: 'oracle'});
            assert.strictEqual(result.sql, 'select * from dual');
        });

        it('should replace "= null" to "is null"', function () {
            const query = Select().from().where({'ID': null});
            const result = query.generate({dialect: 'oracle'});
            assert.strictEqual(result.sql, 'select * from dual where ID is null');
        });


        it('should replace "!= null" to "is not null"', function () {
            const query = Select().from().where({'ID !=': null});
            const result = query.generate({dialect: 'oracle'});
            assert.strictEqual(result.sql, 'select * from dual where ID is not null');
        });


        it('should replace "!= null" to "is not null"', function () {
            const query = Select().from().where({'ID !=': null});
            const result = query.generate({dialect: 'oracle'});
            assert.strictEqual(result.sql, 'select * from dual where ID is not null')
        });

        it('should serialize date-time with "to_date()" function', function () {
            const query = Select()
                .from('table1')
                .where(Eq('dt', new Date(Date.UTC(2017, 0, 1, 10, 30, 15))));
            const result = query.generate({dialect: 'oracle'});
            assert.strictEqual(result.sql, 'select * from table1 where dt = to_date(\'2017-01-01 10:30:15\', \'yyyy-mm-dd hh24:mi:ss\')')
        });

        it('should serialize date with "to_date()" function', function () {
            const query = Select()
                .from('table1')
                .where(Eq('dt', new Date(Date.UTC(2017, 0, 1, 0, 0, 0))));
            const result = query.generate({dialect: 'oracle'});
            assert.strictEqual(result.sql, 'select * from table1 where dt = to_date(\'2017-01-01\', \'yyyy-mm-dd\')')
        });

        it('Should serialize params', function () {
            const query = Select().from('table1').where(Eq('ID', Param('ID')));
            const result = query.generate({
                dialect: 'oracle',
                values: {ID: 5}
            });
            assert.strictEqual(result.sql, 'select * from table1 where ID = :ID');
            assert.deepStrictEqual(result.params, {ID: 5})
        });

        it('Should serialize returning', function () {
            const query = Insert('table1', {'id': 1})
                .returning({id: 'number', name: 'string'});
            const result = query.generate({dialect: 'oracle'});
            assert.strictEqual(result.sql,
                'insert into table1 (id) values (1) returning id into :returning$id, name into :returning$name')
        });

        it('Should serialize returning - table.field', function () {
            const query = Insert('table1', {'id': 1})
                .returning({'table1.id': 'number', 'table1.name': 'string'});
            const result = query.generate({dialect: 'oracle'});
            assert.strictEqual(result.sql,
                'insert into table1 (id) values (1) returning table1.id into :returning$id, table1.name into :returning$name')
        });

        it('Should serialize returning - schema.table.field', function () {
            const query = Insert('table1', {'id': 1})
                .returning({'table1.id': 'number', 'schema1.table1.name': 'string'});
            const result = query.generate({dialect: 'oracle'});
            assert.strictEqual(result.sql,
                'insert into table1 (id) values (1) returning table1.id into :returning$id, schema1.table1.name into :returning$name');
        });

        it('Should serialize returning - reserved word', function () {
            const query = Insert('table1', {'id': 1})
                .returning({id: 'number', 'with w1': 'string'});
            const result = query.generate({dialect: 'oracle'});
            assert.strictEqual(result.sql,
                'insert into table1 (id) values (1) returning id into :returning$id, "with" into :returning$w1')
        });
    });

    describe('Oracle version < 12', function () {

        it('should serialize "limit"', function () {
            const query = Select().from('table1').limit(10);
            const result = query.generate({dialect: 'oracle'});
            assert.strictEqual(result.sql, 'select * from (select * from table1) where rownum <= 10')
        });

        it('should serialize "limit" pretty print', function () {
            const query = Select().from('table1').limit(10);
            const result = query.generate({
                dialect: 'oracle',
                prettyPrint: true
            });
            assert.strictEqual(result.sql,
                'select * from (\n' +
                '  select * from table1\n' +
                ') where rownum <= 10')
        });

        it('should serialize "offset"', function () {
            const query = Select()
                .from('table1')
                .offset(4);
            const result = query.generate({dialect: 'oracle'});
            assert.strictEqual(result.sql,
                'select * from (select /*+ first_rows(100) */ t.*, rownum row$number from (select * from table1) t) where row$number >= 5')
        });

        it('should serialize "limit/offset"', function () {
            const query = Select()
                .from('table1')
                .offset(4)
                .limit(10);
            const result = query.generate({dialect: 'oracle'});
            assert.strictEqual(result.sql,
                'select * from (select /*+ first_rows(10) */ t.*, rownum row$number ' +
                'from (select * from table1) t where rownum <= 14) where row$number >= 5')
        });

        it('should serialize "limit/offset" pretty print', function () {
            const query = Select()
                .from('table1')
                .offset(4)
                .limit(10);
            const result = query.generate({
                dialect: 'oracle',
                prettyPrint: true
            });
            assert.strictEqual(result.sql,
                'select * from (\n' +
                '  select /*+ first_rows(10) */ t.*, rownum row$number from (\n' +
                '    select * from table1\n' +
                '  ) t where rownum <= 14\n' +
                ') where row$number >= 5')
        });

        it('should serialize "limit" ordered', function () {
            const query = Select()
                .from('table1')
                .orderBy('id')
                .limit(10);
            const result = query.generate({dialect: 'oracle'});
            assert.strictEqual(result.sql,
                'select * from (select /*+ first_rows(10) */ t.*, rownum row$number ' +
                'from (select * from table1 order by id) t where rownum <= 10)')
        });

        it('should serialize "limit" ordered pretty print', function () {
            const query = Select()
                .from('table1')
                .orderBy('id')
                .offset(21)
                .limit(10);
            const result = query.generate({
                dialect: 'oracle',
                prettyPrint: true
            });
            assert.strictEqual(result.sql,
                'select * from (\n' +
                '  select /*+ first_rows(10) */ t.*, rownum row$number from (\n' +
                '    select * from table1\n' +
                '    order by id\n' +
                '  ) t where rownum <= 31\n' +
                ') where row$number >= 22')
        });

    });

    describe('Oracle version >= 12', function () {

        it('should serialize "limit"', function () {
            const query = Select().from('table1').limit(10);
            const result = query.generate({
                dialect: 'oracle',
                dialectVersion: '12'
            });
            assert.strictEqual(result.sql, 'select * from table1 FETCH FIRST 10 ROWS ONLY')
        });

        it('should serialize "limit" pretty print', function () {
            const query = Select().from('table1').limit(10);
            const result = query.generate({
                dialect: 'oracle',
                dialectVersion: '12',
                prettyPrint: true
            });
            assert.strictEqual(result.sql,
                'select * from table1\n' +
                'FETCH FIRST 10 ROWS ONLY')
        });

        it('should serialize "offset"', function () {
            const query = Select()
                .from('table1')
                .offset(4);
            const result = query.generate({
                dialect: 'oracle',
                dialectVersion: '12'
            });
            assert.strictEqual(result.sql, 'select * from table1 OFFSET 4 ROWS')
        });

        it('should serialize "limit/offset"', function () {
            const query = Select()
                .from('table1')
                .offset(4)
                .limit(10);
            const result = query.generate({
                dialect: 'oracle',
                dialectVersion: '12'
            });
            assert.strictEqual(result.sql, 'select * from table1 OFFSET 4 ROWS FETCH NEXT 10 ROWS ONLY')
        });

        it('should serialize "limit/offset" pretty print', function () {
            const query = Select()
                .from('table1')
                .offset(4)
                .limit(10);
            const result = query.generate({
                dialect: 'oracle',
                dialectVersion: '12',
                prettyPrint: true
            });
            assert.strictEqual(result.sql,
                'select * from table1\n' +
                'OFFSET 4 ROWS FETCH NEXT 10 ROWS ONLY')
        });

    });


});
