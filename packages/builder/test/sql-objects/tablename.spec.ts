import '../_support/env';
import assert from 'assert';
import {Select} from '@sqb/builder';

describe('serialize "TableName"', function () {

    const options = {
        dialect: 'test',
        prettyPrint: false
    };

    it('should serialize (table)', function () {
        const query = Select().from('table1');
        const result = query.generate(options);
        assert.strictEqual(result.sql, 'select * from table1');
    });

    it('should serialize (table alias)', function () {
        const query = Select().from('table1 t1');
        const result = query.generate(options);
        assert.strictEqual(result.sql, 'select * from table1 t1');
    });

    it('should serialize (schema.table)', function () {
        const query = Select().from('schema1.table1');
        const result = query.generate(options);
        assert.strictEqual(result.sql, 'select * from schema1.table1');
    });

    it('should serialize (schema.table alias)', function () {
        const query = Select().from('schema1.table1 t1');
        const result = query.generate(options);
        assert.strictEqual(result.sql, 'select * from schema1.table1 t1');
    });

    it('should validate schema name', function () {
        assert.throws(() =>
                Select().from('1sch.table1'),
            /does not match table name format/);
    });

    it('should validate table name', function () {
        assert.throws(() =>
                Select().from('sch.1table1'),
            /does not match table name format/);
    });

    it('should validate alias', function () {
        assert.throws(() =>
                Select().from('sch.table1 c+'),
            /does not match table name format/);
    });

});
