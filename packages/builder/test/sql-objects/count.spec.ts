import '../_support/env';
import assert from 'assert';
import {SerializationType, Select, Count} from '@sqb/builder';

describe('serialize "Count"', function () {

    const options = {
        dialect: 'test',
        prettyPrint: false
    };

    it('should initialize Count', function () {
        assert.strictEqual(Count()._type, SerializationType.COUNT_STATEMENT);
    });

    it('should serialize', function () {
        const query = Select(Count()).from('table1');
        const result = query.generate(options);
        assert.strictEqual(result.sql, 'select count(*) from table1');
    });

});
