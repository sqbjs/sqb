import {Case, Eq, Gt, Lt, Select, SerializationType} from '../../src/index.js';

describe('serialize "Case"', function () {

    const options = {
        dialect: 'test',
        prettyPrint: false
    };

    it('should initialize Case', function () {
        expect(Case()._type).toStrictEqual(SerializationType.CASE_STATEMENT);
    });

    it('should serialize single condition in "when"', function () {
        const query = Select(
            Case().when(Gt('age', 16)).then(1).else(0)
        ).from('table1');
        const result = query.generate(options);
        expect(result.sql).toStrictEqual('select case when age > 16 then 1 else 0 end from table1');
    });

    it('should serialize without condition in "when"', function () {
        const query = Select(
            Case().when().then(1).else(100)
        ).from('table1');
        const result = query.generate(options);
        expect(result.sql).toStrictEqual('select * from table1');
    });

    it('should serialize group of conditions in "when"', function () {
        const query = Select(
            Case().when(Gt('col1', 4), Lt('col1', 8)).then(1).else(100)
        ).from('table1');
        const result = query.generate(options);
        expect(result.sql).toStrictEqual('select case when col1 > 4 and col1 < 8 then 1 else 100 end from table1');
    });

    it('should serialize alias', function () {
        const query = Select(
            Case().when(Eq('col1', 5)).then(1).as('col1')
        ).from('table1');
        const result = query.generate(options);
        expect(result.sql).toStrictEqual('select case when col1 = 5 then 1 end col1 from table1');
    });

});
