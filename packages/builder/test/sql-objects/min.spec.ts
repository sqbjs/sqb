import '../_support/env';
import assert from 'assert';
import {Field, Min, Select, SerializationType} from '@sqb/builder';

describe('serialize "Min"', function () {

    const options = {
        dialect: 'test',
        prettyPrint: false
    };

    it('should initialize Min', function () {
        assert.strictEqual(Min('A')._type, SerializationType.MIN_STATEMENT);
    });

    it('should serialize values', function () {
        const query = Select(
            Min('ABC')
        ).from('table1');
        const result = query.generate(options);
        assert.strictEqual(result.sql, `select min('ABC') from table1`);
    });

    it('should serialize Field names', function () {
        const query = Select(
            Min(Field('a'))
        ).from('table1');
        const result = query.generate(options);
        assert.strictEqual(result.sql, `select min(a) from table1`);
    });

    it('should serialize sub query', function () {
        const query = Select(
            Min(Select().from('table2'))
        ).from('table1');
        const result = query.generate(options);
        assert.strictEqual(result.sql, `select min((select * from table2)) from table1`);
    });

    it('should serialize alias', function () {
        const query = Select(
            Min(1).as('col1')
        ).from('table1');
        const result = query.generate(options);
        assert.strictEqual(result.sql, 'select min(1) col1 from table1');
    });

});
