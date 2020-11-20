import '../_support/env';
import assert from 'assert';
import {
    SerializationType, Select, Join,
    InnerJoin, LeftJoin, LeftOuterJoin, RightJoin, RightOuterJoin,
    OuterJoin, FullOuterJoin, Eq, Raw
} from '@sqb/builder';

describe('serialize "Join"', function () {

    const options = {
        dialect: 'test',
        prettyPrint: false
    };

    it('should initialize Join', function () {
        assert.strictEqual(Join('table1')._type, SerializationType.JOIN);
    });

    it('should serialize (join)', function () {
        const query = Select().from('table1 t1')
            .join(Join('table2 t2').on());
        const result = query.generate(options);
        assert.strictEqual(result.sql, 'select * from table1 t1 inner join table2 t2');
    });

    it('should serialize (innerJoin)', function () {
        const query = Select().from('table1 t1')
            .join(InnerJoin('table2 t2'));
        const result = query.generate(options);
        assert.strictEqual(result.sql, 'select * from table1 t1 inner join table2 t2');
    });

    it('should serialize (leftJoin)', function () {
        const query = Select().from('table1 t1')
            .join(LeftJoin('table2 t2'));
        const result = query.generate(options);
        assert.strictEqual(result.sql, 'select * from table1 t1 left join table2 t2');
    });

    it('should serialize (leftOuterJoin)', function () {
        const query = Select().from('table1 t1')
            .join(LeftOuterJoin('table2 t2'));
        const result = query.generate(options);
        assert.strictEqual(result.sql, 'select * from table1 t1 left outer join table2 t2');
    });

    it('should serialize (rightJoin)', function () {
        const query = Select().from('table1 t1')
            .join(RightJoin('table2 t2'));
        const result = query.generate(options);
        assert.strictEqual(result.sql, 'select * from table1 t1 right join table2 t2');
    });

    it('should serialize (rightOuterJoin)', function () {
        const query = Select().from('table1 t1')
            .join(RightOuterJoin('table2 t2'));
        const result = query.generate(options);
        assert.strictEqual(result.sql, 'select * from table1 t1 right outer join table2 t2');
    });

    it('should serialize (outerJoin)', function () {
        const query = Select().from('table1 t1')
            .join(OuterJoin('table2 t2'));
        const result = query.generate(options);
        assert.strictEqual(result.sql, 'select * from table1 t1 outer join table2 t2');
    });

    it('should serialize (fullOuterJoin)', function () {
        const query = Select().from('table1 t1')
            .join(FullOuterJoin('table2 t2'));
        const result = query.generate(options);
        assert.strictEqual(result.sql, 'select * from table1 t1 full outer join table2 t2');
    });

    it('should serialize conditions', function () {
        const query = Select().from('table1 t1')
            .join(Join('table2 t2').on(Eq('t2.id', Raw('t1.id'))));
        const result = query.generate(options);
        assert.strictEqual(result.sql, 'select * from table1 t1 inner join table2 t2 on t2.id = t1.id');
    });

    it('should serialize sub-select as table', function () {
        const query = Select().from('table1 t1')
            .join(Join(
                Select().from('table2').as('t2')
            ));
        const result = query.generate(options);
        assert.strictEqual(result.sql, 'select * from table1 t1 inner join (select * from table2) t2');
    });

    it('should serialize sub-select as table (pretty)', function () {
        const query = Select().from('table1 t1')
            .join(Join(
                Select('field1', 'field2', 'field3', 'field4', 'field5')
                    .from('table2')
                    .as('t2')
            ));
        const result = query.generate({prettyPrint: true});
        assert.strictEqual(result.sql, 'select * from table1 t1\n' +
            'inner join (\n' +
            '  select field1, field2, field3, field4, field5 from table2\n' +
            ') t2');
    });

    it('should serialize Raw as table', function () {
        const query = Select().from('table1 t1')
            .join(Join(Raw('table2 t2')));
        const result = query.generate(options);
        assert.strictEqual(result.sql, 'select * from table1 t1 inner join table2 t2');
    });

    it('should validate first argument', function () {
        assert.throws(() =>
                // @ts-ignore
                Join(1),
            /required for Join/);
    });

    it('should validate alias for sub-select', function () {
        assert.throws(() => {
                const query = Select().from('table1 t1')
                    .join(Join(Select().from('table2')));
                query.generate();
            },
            /Alias required for sub-select in Join/);
    });

});
