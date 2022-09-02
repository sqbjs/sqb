import {Field, Max, Select, SerializationType} from '../../src/index.js';

describe('serialize "Max"', function () {

    const options = {
        dialect: 'test',
        prettyPrint: false
    };

    it('should initialize Max', function () {
        expect(Max('A')._type).toStrictEqual(SerializationType.MAX_STATEMENT);
    });

    it('should serialize values', function () {
        const query = Select(
            Max('ABC')
        ).from('table1');
        const result = query.generate(options);
        expect(result.sql).toStrictEqual(`select max('ABC') from table1`);
    });

    it('should serialize Field names', function () {
        const query = Select(
            Max(Field('a'))
        ).from('table1');
        const result = query.generate(options);
        expect(result.sql).toStrictEqual(`select max(a) from table1`);
    });

    it('should serialize sub query', function () {
        const query = Select(
            Max(Select().from('table2'))
        ).from('table1');
        const result = query.generate(options);
        expect(result.sql).toStrictEqual(`select max((select * from table2)) from table1`);
    });

    it('should serialize alias', function () {
        const query = Select(
            Max(1).as('col1')
        ).from('table1');
        const result = query.generate(options);
        expect(result.sql).toStrictEqual('select max(1) col1 from table1');
    });

});
