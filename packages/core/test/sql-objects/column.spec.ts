import assert from 'assert';
import {Select} from '@sqb/core';

describe('serialize "SelectColumn"', function () {

    const options = {
        dialect: 'test',
        prettyPrint: false
    };

    it('should serialize (field)', function () {
        const query = Select('field1').from('table1');
        const result = query.generate(options);
        assert.strictEqual(result.sql, 'select field1 from table1');
    });

    it('should serialize (field alias)', function () {
        const query = Select('field1 f1').from('table1');
        const result = query.generate(options);
        assert.strictEqual(result.sql, 'select field1 f1 from table1');
    });

    it('should serialize (table.field)', function () {
        const query = Select('table1.field1').from('table1');
        const result = query.generate(options);
        assert.strictEqual(result.sql, 'select table1.field1 from table1');
    });

    it('should serialize (table.field alias)', function () {
        const query = Select('table1.field1 f1').from('table1');
        const result = query.generate(options);
        assert.strictEqual(result.sql, 'select table1.field1 f1 from table1');
    });

    it('should serialize (schema.table.field)', function () {
        const query = Select('schema1.table1.field1').from('table1');
        const result = query.generate(options);
        assert.strictEqual(result.sql, 'select schema1.table1.field1 from table1');
    });

    it('should serialize (schema.table.field alias)', function () {
        const query = Select('schema1.table1.field1 f1').from('table1');
        const result = query.generate(options);
        assert.strictEqual(result.sql, 'select schema1.table1.field1 f1 from table1');
    });

    it('should table and column start with "_" character', function () {
        const query = Select('_table1._field1 _f1').from('table1');
        const result = query.generate(options);
        assert.strictEqual(result.sql, 'select _table1._field1 _f1 from table1');
    });

    it('should "$" character can be used for table and column names', function () {
        const query = Select('table1$.field1$ f1$').from('table1');
        const result = query.generate(options);
        assert.strictEqual(result.sql, 'select table1$.field1$ f1$ from table1');
    });

    it('should not table name start with "$" character', function () {
        assert.throws(() =>
                Select('$table1.field1 f1').from('table1'),
            /does not match table column format/);
    });

    it('should not column name start with "$" character', function () {
        assert.throws(() =>
                Select('table1.$field1 f1').from('table1'),
            /does not match table column format/);
    });

    it('should not alias name start with "$" character', function () {
        assert.throws(() =>
                Select('table1.field1 $f1').from('table1'),
            /does not match table column format/);
    });

    it('should not print alias if field is *', function () {
        const query = Select('schema1.table1.* f1').from('table1');
        const result = query.generate(options);
        assert.strictEqual(result.sql, 'select schema1.table1.* from table1');
    });

    it('should place into double quote if field name is reserved', function () {
        const query = Select('with').from('table1');
        const result = query.generate(options);
        assert.strictEqual(result.sql, 'select "with" from table1');
    });

    it('should validate schema name', function () {
        assert.throws(() =>
                Select('a+.table1.field1 f1').from('table1'),
            /does not match table column format/);
    });

    it('should validate table name', function () {
        assert.throws(() =>
            Select('a+.field1 f1').from('table1'),
            /does not match table column format/);
    });

    it('should validate field name', function () {
        assert.throws(() =>
            Select('a+ f1').from('table1'),
            /does not match table column format/);
    });

    it('should validate alias', function () {
        assert.throws(() =>
            Select('field1 a+').from('table1'),
            /does not match table column format/);
    });

});
