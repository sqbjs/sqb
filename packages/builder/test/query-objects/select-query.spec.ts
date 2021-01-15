import '../_support/env';
import assert from 'assert';
import {
    registerSerializer, unRegisterSerializer,
    Select, Raw, SerializationType, Eq, Param
} from '@sqb/builder';
import {TestSerializer} from '../_support/test_serializer';


describe('serialize "SelectQuery"', function () {

    const options = {
        dialect: 'test',
        prettyPrint: false
    };

    const testSerializer = new TestSerializer();

    before(() => registerSerializer(testSerializer));
    after(() => unRegisterSerializer(testSerializer));

    it('should initialize SelectQuery', function () {
        const q = Select();
        assert.strictEqual(q._type, SerializationType.SELECT_QUERY);
    });

    it('should serialize * for when no columns given', function () {
        const query = Select('*').addColumn().from('table1');
        const result = query.generate(options);
        assert.strictEqual(result.sql, 'select * from table1');
    });

    it('should serialize when no tables given', function () {
        const query = Select();
        const result = query.generate(options);
        assert.strictEqual(result.sql, 'select *');
    });

    it('should serialize simple query', function () {
        const query = Select('field1', 'field2', 'field3',
            'field4', 'field5', 'field6', 'field7', 'field8', 'field9', 'field10',
            'field11', 'field12', 'field13', 'field14', 'field15', 'field16'
        ).from('table1');
        const result = query.generate({
            prettyPrint: true
        });
        assert.strictEqual(result.sql, 'select\n' +
            '  field1, field2, field3, field4, field5, field6, field7, field8,\n' +
            '  field9, field10, field11, field12, field13, field14, field15,\n' +
            '  field16\n' +
            'from table1');
    });

    it('should pass array as columns', function () {
        const query = Select(['field1', 'field2'], 'field3',
            'field4', ['field5', 'field6', 'field7', 'field8', 'field9'],
            'field10').from('table1');
        const result = query.generate(options);
        assert.strictEqual(result.sql, 'select field1, field2, field3, field4, field5, ' +
            'field6, field7, field8, field9, field10 from table1');
    });

    it('should skip empty columns, tables, joins, group columns and order columns', function () {
        const query = Select('field1', '')
            .from('schema1.table1 t1', '')
            .join(null)
            .groupBy('')
            .orderBy('');
        const result = query.generate(options);
        assert.strictEqual(result.sql, 'select field1 from schema1.table1 t1');
    });

    it('should serialize raw in columns', function () {
        const query = Select(Raw('\'John\'\'s Bike\' f1'))
            .from('table1');
        const result = query.generate(options);
        assert.strictEqual(result.sql, 'select \'John\'\'s Bike\' f1 from table1');
    });

    it('should serialize sub-select in columns', function () {
        const sub = Select('id').from('table2').as('id2');
        const query = Select(sub)
            .from('table1');
        const result = query.generate(options);
        assert.strictEqual(result.sql, 'select (select id from table2) id2 from table1');
    });

    it('should serialize raw in "from" part', function () {
        const query = Select().from('table1', Raw('func1()'));
        const result = query.generate(options);
        assert.strictEqual(result.sql, 'select * from table1,func1()');
    });

    it('should serialize sub-select in "from"', function () {
        const query = Select()
            .from(Select('field1', 'field2', 'field3',
                'field4', 'field5', 'field6', 'field7', 'field8').from('table1')
                .as('t1'));
        const result = query.generate(options);
        assert.strictEqual(result.sql,
            'select * from ' +
            '(select field1, field2, field3, field4, field5, field6, field7, field8 ' +
            'from table1) t1');
    });

    it('should serialize raw in "order by"', function () {
        const query = Select()
            .from('table1')
            .orderBy(Raw('field1'));
        const result = query.generate(options);
        assert.strictEqual(result.sql, 'select * from table1 order by field1');
    });

    it('should pretty print - test1', function () {
        const query = Select()
            .from(Select('field1', 'field2', 'field3',
                'field4', 'field5', 'field6', 'field7', 'field8').from('table1')
                .as('t1'));
        const result = query.generate({prettyPrint: true});
        assert.strictEqual(result.sql,
            'select * from\n' +
            '  (select field1, field2, field3, field4, field5, field6, field7, field8\n' +
            '  from table1) t1');
    });

    it('should serialize params', function () {
        const query = Select()
            .from('table1')
            .where({id: Param('id')})
        const result = query.generate({...options, params: {id: 1}});
        assert.strictEqual(result.sql, 'select * from table1 where id = ::id');
        assert.strictEqual(result.params.id, 1);
    });

    it('should force using params if strictParams=true', function () {
        const query = Select()
            .from('table1')
            .where({id: 1})
        const result = query.generate({...options, strictParams: true});
        assert.strictEqual(result.sql, 'select * from table1 where id = ::strictParam$1');
        assert.strictEqual(result.params.strictParam$1, 1);
    });

    it('should pretty print - test2', function () {
        const query = Select()
            .from('table1')
            .where(
                Eq('ID', 1),
                Eq('name', 'value of the field should be too long'),
                Eq('ID', 1), Eq('ID', 12345678)
            )
            .groupBy('field1', 'field2', Raw('field3'));
        const result = query.generate({prettyPrint: true});
        assert.strictEqual(result.sql, 'select * from table1\n' +
            'where ID = 1 and name = \'value of the field should be too long\' and\n' +
            '  ID = 1 and ID = 12345678\n' +
            'group by field1, field2, field3');
    });

    it('should assign limit ', function () {
        const query = Select().from('table1').limit(5);
        assert.strictEqual(query._limit, 5);
    });

    it('should assign offset ', function () {
        const query = Select().from('table1').offset(5);
        assert.strictEqual(query._offset, 5);
    });

    it('should pass only Join instance to join() function', function () {
        assert.throws(() =>
                // @ts-ignore
                Select().from('table1').join('dfd'),
            /Join statement required/);
    });

    it('should validate alias for sub-select in columns', function () {
        assert.throws(() => {
            const query = Select(
                Select().from('table2')
            ).from('table1 t1');
            query.generate();
        }, /Alias required for sub-select in columns/);
    });

    it('should validate alias for sub-select in "from"', function () {
        assert.throws(() => {
            const query = Select().from(
                Select().from('table2'));
            query.generate();
        }, /Alias required for sub-select in "from"/);
    });

});
