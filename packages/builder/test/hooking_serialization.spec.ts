import './_support/env';
import assert from 'assert';
import {SerializationType, Select, Eq} from '@sqb/builder';

describe('Hooking serialization', function () {

    const options = {
        dialect: 'test',
        prettyPrint: false
    };

    it('should hook serialization', function () {
        const query = Select()
            .from('table1')
            .on('serialize', (ctx, type) => {
                if (type === 'table_name')
                    return 'table2';
            });
        const result = query.generate(options);
        assert.strictEqual(result.sql, 'select * from table2');
    });

    it('should continue serialization with modified options', function () {
        const query = Select()
            .from('table1')
            .where(Eq('id', 1))
            .on('serialize', function (ctx, type, o) {
                if (type === SerializationType.COMPARISON_EXPRESSION)
                    o.left = 'new_id';
            });
        const result = query.generate(options);
        assert.strictEqual(result.sql, 'select * from table1 where new_id = 1');
    });

});
