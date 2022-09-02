import {Select} from '../../src/index.js';

describe('serialize "GroupColumn"', function () {

    const options = {
        dialect: 'test',
        prettyPrint: false
    };

    it('should serialize (field)', function () {
        const query = Select().from('table1').groupBy('field1');
        const result = query.generate(options);
        expect(result.sql).toStrictEqual('select * from table1 group by field1');
    });

    it('should serialize (table.field)', function () {
        const query = Select().from('table1').groupBy('table1.field1');
        const result = query.generate(options);
        expect(result.sql).toStrictEqual('select * from table1 group by table1.field1');
    });

    it('should serialize (schema.table.field)', function () {
        const query = Select().from('table1').groupBy('schema1.table1.field1');
        const result = query.generate(options);
        expect(result.sql).toStrictEqual('select * from table1 group by schema1.table1.field1');
    });

    it('should place into double quote if field name is reserved', function () {
        const query = Select().from('table1').groupBy('schema1.table1.with');
        const result = query.generate(options);
        expect(result.sql).toStrictEqual('select * from table1 group by schema1.table1."with"');
    });

    it('should validate schema name', function () {
        expect(() =>
            Select().from('table1').groupBy('1sch.field1')
        ).toThrow('does not match group column format');
    });

    it('should validate table name', function () {
        expect(() =>
            Select().from('table1').groupBy('schema.-field1')
        ).toThrow('does not match group column format');
    });

    it('should validate order word', function () {
        expect(() =>
            Select().from('table1').groupBy('schema.field1 dss')
        ).toThrow('does not match group column format');
    });

});
