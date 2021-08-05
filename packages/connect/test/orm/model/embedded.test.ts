/* eslint-disable @typescript-eslint/unbound-method,@typescript-eslint/no-unused-vars */
import '../../_support/env';
import * as assert from 'assert';
import {Column, Embedded, Entity} from '@sqb/connect';

describe('Embedded object element', function () {

    class PersonName {
        @Column()
        given: string
        @Column()
        family: string
    }

    it(`should define embedded element metadata`, () => {
        class MyEntity {
            @Embedded(PersonName)
            name: PersonName;
        }

        const meta = Entity.getMetadata(MyEntity);
        assert.ok(meta);
        assert.strictEqual(meta.name, 'MyEntity');
        const name = meta.getObjectElement('name');
        assert.ok(name);
        assert.strictEqual(name.type, PersonName);
    });

    it(`should define prefix and suffix`, () => {
        class MyEntity {
            @Embedded(PersonName, {
                fieldNamePrefix: 'prefix',
                fieldNameSuffix: 'suffix'
            })
            name: PersonName;
        }

        const meta = Entity.getMetadata(MyEntity);
        assert.ok(meta);
        assert.strictEqual(meta.name, 'MyEntity');
        const name = meta.getObjectElement('name');
        assert.ok(name);
        assert.strictEqual(name.type, PersonName);
        assert.strictEqual(name.fieldNamePrefix, 'prefix');
        assert.strictEqual(name.fieldNameSuffix, 'suffix');
    });

});
