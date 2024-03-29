import {DataType, Field, Select} from '../../src/index.js';

describe('serialize "TableField"', function () {

    const options = {
        dialect: 'test',
        prettyPrint: false
    };

    it('should initialize from string', function () {
        const query = Select('field1').from('table1');
        const result = query.generate(options);
        expect(result.sql).toStrictEqual('select field1 from table1');
    });

    it('should initialize from constructor', function () {
        const query = Select(Field('t.field1 f1', DataType.VARCHAR, false)).from('table1');
        expect(query._columns?.[0]).toBeDefined();
        expect((query._columns?.[0] as any)._field).toStrictEqual('field1');
        expect((query._columns?.[0] as any)._table).toStrictEqual('t');
        expect((query._columns?.[0] as any)._alias).toStrictEqual('f1');
        const result = query.generate(options);
        expect(result.sql).toStrictEqual('select t.field1 as f1 from table1');
    });

    it('should serialize (field alias)', function () {
        const query = Select('field1 f1').from('table1');
        const result = query.generate(options);
        expect(result.sql).toStrictEqual('select field1 as f1 from table1');
    });

    it('should serialize (table.field)', function () {
        const query = Select('table1.field1').from('table1');
        const result = query.generate(options);
        expect(result.sql).toStrictEqual('select table1.field1 from table1');
    });

    it('should serialize (table.field alias)', function () {
        const query = Select('table1.field1 f1').from('table1');
        const result = query.generate(options);
        expect(result.sql).toStrictEqual('select table1.field1 as f1 from table1');
    });

    it('should serialize (schema.table.field)', function () {
        const query = Select('schema1.table1.field1').from('table1');
        const result = query.generate(options);
        expect(result.sql).toStrictEqual('select schema1.table1.field1 from table1');
    });

    it('should serialize (schema.table.field alias)', function () {
        const query = Select('schema1.table1.field1 f1').from('table1');
        const result = query.generate(options);
        expect(result.sql).toStrictEqual('select schema1.table1.field1 as f1 from table1');
    });

    it('should table and column start with "_" character', function () {
        const query = Select('_table1._field1 _f1').from('table1');
        const result = query.generate(options);
        expect(result.sql).toStrictEqual('select _table1._field1 as _f1 from table1');
    });

    it('should "$" character can be used for table and column names', function () {
        const query = Select('table1$.field1$ f1$').from('table1');
        const result = query.generate(options);
        expect(result.sql).toStrictEqual('select table1$.field1$ as f1$ from table1');
    });

    it('should not table name start with "$" character', function () {
        expect(() =>
            Select('$table1.field1 f1').from('table1')
        ).toThrow('does not match table column format');
    });

    it('should not column name start with "$" character', function () {
        expect(() =>
            Select('table1.$field1 f1').from('table1')
        ).toThrow('does not match table column format');
    });

    it('should not alias name start with "$" character', function () {
        expect(() =>
            Select('table1.field1 $f1').from('table1')
        ).toThrow('does not match table column format');
    });

    it('should not print alias if field is *', function () {
        const query = Select('schema1.table1.* f1').from('table1');
        const result = query.generate(options);
        expect(result.sql).toStrictEqual('select schema1.table1.* from table1');
    });

    it('should place into double quote if field name is reserved', function () {
        const query = Select('with').from('table1');
        const result = query.generate(options);
        expect(result.sql).toStrictEqual('select "with" from table1');
    });

    it('should validate schema name', function () {
        expect(() =>
            Select('a+.table1.field1 f1').from('table1')
        ).toThrow('does not match table column format');
    });

    it('should validate table name', function () {
        expect(() =>
            Select('a+.field1 f1').from('table1')
        ).toThrow('does not match table column format');
    });

    it('should validate field name', function () {
        expect(() =>
            Select('a+ f1').from('table1')
        ).toThrow('does not match table column format');
    });

    it('should validate alias', function () {
        expect(() =>
            Select('field1 a+').from('table1')
        ).toThrow('does not match table column format');
    });

});
