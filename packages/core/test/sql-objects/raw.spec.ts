import assert from 'assert';
import {Raw, Select, SerializationType} from '@sqb/core';

describe('serialize "Raw"', () => {

    const options = {
        prettyPrint: false
    };

    it('should initialize Raw', () => {
        assert.strictEqual(Raw('')._type, SerializationType.RAW);
    });

    it('should serialize Raw', () => {
        const query = Select(Raw('\'John\'\'s Bike\' f1'))
            .from('table1');
        const result = query.generate(options);
        assert.strictEqual(result.sql, 'select \'John\'\'s Bike\' f1 from table1');
    });

});
