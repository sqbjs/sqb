import '../_support/env';
import assert from 'assert';
import {Field, Lower, Select, SerializationType} from '@sqb/builder';

describe('serialize "Lower"', function () {

    const options = {
        dialect: 'test',
        prettyPrint: false
    };

    it('should initialize Lower', function () {
        assert.strictEqual(Lower('A')._type, SerializationType.LOWER_STATEMENT);
    });

    it('should serialize values', function () {
        const query = Select(
            Lower('ABC')
        ).from('table1');
        const result = query.generate(options);
        assert.strictEqual(result.sql, `select lower('ABC') from table1`);
    });

    it('should serialize Field names', function () {
        const query = Select(
            Lower(Field('a'))
        ).from('table1');
        const result = query.generate(options);
        assert.strictEqual(result.sql, `select lower(a) from table1`);
    });

    it('should serialize sub query', function () {
        const query = Select(
            Lower(Select().from('table2'))
        ).from('table1');
        const result = query.generate(options);
        assert.strictEqual(result.sql, `select lower((select * from table2)) from table1`);
    });

    it('should serialize alias', function () {
        const query = Select(
            Lower(1).as('col1')
        ).from('table1');
        const result = query.generate(options);
        assert.strictEqual(result.sql, 'select lower(1) col1 from table1');
    });

});
