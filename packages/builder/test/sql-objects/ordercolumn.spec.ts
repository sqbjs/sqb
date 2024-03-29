import {Select} from '../../src/index.js';

describe('serialize "OrderColumn"', function () {

    const options = {
        dialect: 'test',
        prettyPrint: false
    };

    it('should serialize (field)', function () {
        const query = Select().from('table1').orderBy('field1');
        const result = query.generate(options);
        expect(result.sql).toStrictEqual('select * from table1 order by field1');
    });

    it('should serialize (table.field)', function () {
        const query = Select().from('table1').orderBy('table1._field1');
        const result = query.generate(options);
        expect(result.sql).toStrictEqual('select * from table1 order by table1._field1');
    });

    it('should serialize (schema.table.field)', function () {
        const query = Select().from('table1').orderBy('schema1.table1.field1');
        const result = query.generate(options);
        expect(result.sql).toStrictEqual('select * from table1 order by schema1.table1.field1');
    });

    it('should serialize (+field)', function () {
        const query = Select().from('table1').orderBy('+field1');
        const result = query.generate(options);
        expect(result.sql).toStrictEqual('select * from table1 order by field1');
    });

    it('should serialize (-field)', function () {
        const query = Select().from('table1').orderBy('-field1');
        const result = query.generate(options);
        expect(result.sql).toStrictEqual('select * from table1 order by field1 desc');
    });

    it('should serialize (field asc)', function () {
        const query = Select().from('table1').orderBy('field1 asc');
        const result = query.generate(options);
        expect(result.sql).toStrictEqual('select * from table1 order by field1');
    });

    it('should serialize (field ascending)', function () {
        const query = Select().from('table1').orderBy('field1 ascending');
        const result = query.generate(options);
        expect(result.sql).toStrictEqual('select * from table1 order by field1');
    });

    it('should serialize (field desc)', function () {
        const query = Select().from('table1').orderBy('field1 desc');
        const result = query.generate(options);
        expect(result.sql).toStrictEqual('select * from table1 order by field1 desc');
    });

    it('should serialize (field descending)', function () {
        const query = Select().from('table1').orderBy('field1 descending');
        const result = query.generate(options);
        expect(result.sql).toStrictEqual('select * from table1 order by field1 desc');
    });

    it('should place into double quote if field name is reserved', function () {
        const query = Select().from('table1').orderBy('with descending');
        const result = query.generate(options);
        expect(result.sql).toStrictEqual('select * from table1 order by "with" desc');
    });

    it('should validate schema name', function () {
        expect(() =>
            Select().from('table1').orderBy('1sch.field1')
        ).toThrow('does not match order column format');
    });

    it('should validate table name', function () {
        expect(() =>
            Select().from('table1').orderBy('schema.1field1')
        ).toThrow('does not match order column format');
    });

    it('should validate order word', function () {
        expect(() =>
            Select().from('table1').orderBy('schema.field1 dss')
        ).toThrow('does not match order column format');
    });

});
