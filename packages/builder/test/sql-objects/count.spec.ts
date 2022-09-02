import {Count, Select, SerializationType} from '../../src/index.js';

describe('serialize "Count"', function () {

    const options = {
        dialect: 'test',
        prettyPrint: false
    };

    it('should initialize Count', function () {
        expect(Count()._type).toStrictEqual(SerializationType.COUNT_STATEMENT);
    });

    it('should serialize', function () {
        const query = Select(Count()).from('table1');
        const result = query.generate(options);
        expect(result.sql).toStrictEqual('select count(*) from table1');
    });

});
