import '../_support/env';
import assert from 'assert';
import {Select, SequenceCurr,SequenceNext, SerializationType} from '@sqb/builder';

describe('serialize "Sequence Getter"', function () {

    const options = {
        dialect: 'test',
        prettyPrint: false
    };

    it('should initialize genID', function () {
        assert.strictEqual(SequenceNext('A')._type, SerializationType.SEQUENCE_GETTER_STATEMENT);
    });

    it('should serialize nextval', function () {
        const query = Select(
            SequenceNext('ABC')
        );
        const result = query.generate(options);
        assert.strictEqual(result.sql, `select nextval('ABC')`);
    });

    it('should serialize currval', function () {
        const query = Select(
            SequenceCurr('ABC')
        );
        const result = query.generate(options);
        assert.strictEqual(result.sql, `select currval('ABC')`);
    });

    it('should serialize alias', function () {
        const query = Select(
            SequenceNext('test').as('col1')
        )
        const result = query.generate(options);
        assert.strictEqual(result.sql, `select nextval('test') col1`);
    });

});
