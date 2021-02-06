/* eslint-disable @typescript-eslint/unbound-method,@typescript-eslint/no-unused-vars */
import '../../_support/env';
import * as assert from 'assert';
import {Column, DataType, Entity} from '@sqb/connect';
import {ColumnGroup} from '@sqb/connect/src/orm/decorators/column-group.decorator';

describe('ColumnGroup()', function () {

    class PersonName {
        @Column()
        given: string
        @Column()
        family: string
    }

    it(`should define group column metadata`, () => {
        class MyEntity {
            @ColumnGroup(PersonName)
            name: PersonName;
        }

        const meta = Entity.getMetadata(MyEntity);
        assert.ok(meta);
        assert.strictEqual(meta.name, 'MyEntity');
        const name = meta.getGroupColumn('name');
        assert.ok(name);
        assert.strictEqual(name.type, PersonName);
    });

    it(`should define prefix ans suffix`, () => {
        class MyEntity {
            @ColumnGroup({
                type: PersonName,
                fieldNamePrefix: 'prefix',
                fieldNameSuffix: 'suffix'
            })
            name: PersonName;
        }

        const meta = Entity.getMetadata(MyEntity);
        assert.ok(meta);
        assert.strictEqual(meta.name, 'MyEntity');
        const name = meta.getGroupColumn('name');
        assert.ok(name);
        assert.strictEqual(name.type, PersonName);
        assert.strictEqual(name.fieldNamePrefix, 'prefix');
        assert.strictEqual(name.fieldNameSuffix, 'suffix');
    });

});
