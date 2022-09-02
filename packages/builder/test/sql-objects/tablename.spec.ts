import {Select} from '../../src/index.js';

describe('serialize "TableName"', function () {

    const options = {
        dialect: 'test',
        prettyPrint: false
    };

    it('should serialize (table)', function () {
        const query = Select().from('table1');
        const result = query.generate(options);
        expect(result.sql).toStrictEqual('select * from table1');
    });

    it('should serialize (table alias)', function () {
        const query = Select().from('table1 t1');
        const result = query.generate(options);
        expect(result.sql).toStrictEqual('select * from table1 t1');
    });

    it('should serialize (schema.table)', function () {
        const query = Select().from('schema1.table1');
        const result = query.generate(options);
        expect(result.sql).toStrictEqual('select * from schema1.table1');
    });

    it('should serialize (schema.table alias)', function () {
        const query = Select().from('schema1.table1 t1');
        const result = query.generate(options);
        expect(result.sql).toStrictEqual('select * from schema1.table1 t1');
    });

    it('should validate schema name', function () {
        expect(() =>
            Select().from('1sch.table1')
        ).toThrow('does not match table name format');
    });

    it('should validate table name', function () {
        expect(() =>
            Select().from('sch.1table1')
        ).toThrow('does not match table name format');
    });

    it('should validate alias', function () {
        expect(() =>
            Select().from('sch.table1 c+')
        ).toThrow('does not match table name format');
    });

});
