import '../_support/env';
import assert from 'assert';
import {Field, Max, Select, SerializationType} from '@sqb/builder';

describe('serialize "Max"', function () {

    const options = {
        dialect: 'test',
        prettyPrint: false
    };

    it('should initialize Max', function () {
        assert.strictEqual(Max('A')._type, SerializationType.MAX_STATEMENT);
    });

    it('should serialize values', function () {
        const query = Select(
            Max('ABC')
        ).from('table1');
        const result = query.generate(options);
        assert.strictEqual(result.sql, `select max('ABC') from table1`);
    });

    it('should serialize Field names', function () {
        const query = Select(
            Max(Field('a'))
        ).from('table1');
        const result = query.generate(options);
        assert.strictEqual(result.sql, `select max(a) from table1`);
    });

    it('should serialize sub query', function () {
        const query = Select(
            Max(Select().from('table2'))
        ).from('table1');
        const result = query.generate(options);
        assert.strictEqual(result.sql, `select max((select * from table2)) from table1`);
    });

    it('should serialize alias', function () {
        const query = Select(
            Max(1).as('col1')
        ).from('table1');
        const result = query.generate(options);
        assert.strictEqual(result.sql, 'select max(1) col1 from table1');
    });

});
