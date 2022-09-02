import {Select, SequenceCurr, SequenceNext, SerializationType} from '../../src/index.js';

describe('serialize "Sequence Getter"', function () {

    const options = {
        dialect: 'test',
        prettyPrint: false
    };

    it('should initialize genID', function () {
        expect(SequenceNext('A')._type).toStrictEqual(SerializationType.SEQUENCE_GETTER_STATEMENT);
    });

    it('should serialize nextval', function () {
        const query = Select(
            SequenceNext('ABC')
        );
        const result = query.generate(options);
        expect(result.sql).toStrictEqual(`select nextval('ABC')`);
    });

    it('should serialize currval', function () {
        const query = Select(
            SequenceCurr('ABC')
        );
        const result = query.generate(options);
        expect(result.sql).toStrictEqual(`select currval('ABC')`);
    });

    it('should serialize alias', function () {
        const query = Select(
            SequenceNext('test').as('col1')
        )
        const result = query.generate(options);
        expect(result.sql).toStrictEqual(`select nextval('test') col1`);
    });

});
