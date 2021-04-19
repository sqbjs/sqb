/* eslint-disable @typescript-eslint/unbound-method,@typescript-eslint/no-unused-vars */
import '../../_support/env';
import * as assert from 'assert';
import {Column, Embedded, Entity} from '@sqb/connect';

describe('Nested object element', function () {

    class PersonName {
        @Column()
        given: string
        @Column()
        family: string
    }

    it(`should define nested element metadata`, () => {
        class MyEntity {
            @Embedded(PersonName)
            name: PersonName;
        }

        const meta = Entity.getMetadata(MyEntity);
        assert.ok(meta);
        assert.strictEqual(meta.name, 'MyEntity');
        const name = meta.getEmbeddedElement('name');
        assert.ok(name);
        assert.strictEqual(name.type, PersonName);
    });

    it(`should define prefix ans suffix`, () => {
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
        const name = meta.getEmbeddedElement('name');
        assert.ok(name);
        assert.strictEqual(name.type, PersonName);
        assert.strictEqual(name.fieldNamePrefix, 'prefix');
        assert.strictEqual(name.fieldNameSuffix, 'suffix');
    });

});
