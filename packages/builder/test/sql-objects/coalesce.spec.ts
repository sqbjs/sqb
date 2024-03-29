import {Coalesce, Field, Select, SerializationType} from '../../src/index.js';

describe('serialize "Coalesce"', function () {

    const options = {
        dialect: 'test',
        prettyPrint: false
    };

    it('should initialize Coalesce', function () {
        expect(Coalesce()._type).toStrictEqual(SerializationType.COALESCE_STATEMENT);
    });

    it('should serialize values', function () {
        const query = Select(
            Coalesce(null, 'a', 1)
        ).from('table1');
        const result = query.generate(options);
        expect(result.sql).toStrictEqual(`select coalesce(null, 'a', 1) from table1`);
    });

    it('should serialize Field names', function () {
        const query = Select(
            Coalesce(Field('a'), Field('b'))
        ).from('table1');
        const result = query.generate(options);
        expect(result.sql).toStrictEqual(`select coalesce(a, b) from table1`);
    });

    it('should serialize sub query', function () {
        const query = Select(
            Coalesce(Select().from('table2'))
        ).from('table1');
        const result = query.generate(options);
        expect(result.sql).toStrictEqual(`select coalesce((select * from table2)) from table1`);
    });

    it('should serialize alias', function () {
        const query = Select(
            Coalesce(1, 2).as('col1')
        ).from('table1');
        const result = query.generate(options);
        expect(result.sql).toStrictEqual('select coalesce(1, 2) col1 from table1');
    });

});
