/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {Column, Embedded, Entity, EntityMetadata} from '@sqb/connect';

describe('Model / Embedded object element', function () {

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
        expect(meta).toBeDefined();
        expect(meta!.name).toStrictEqual('MyEntity');
        const name = EntityMetadata.getEmbeddedField(meta!, 'name');
        expect(name).toBeDefined();
        expect(name!.type).toStrictEqual(PersonName);
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
        expect(meta).toBeDefined();
        expect(meta!.name).toStrictEqual('MyEntity');
        const name = EntityMetadata.getEmbeddedField(meta!, 'name');
        expect(name).toBeDefined();
        expect(name!.type).toStrictEqual(PersonName);
        expect(name!.fieldNamePrefix).toStrictEqual('prefix');
        expect(name!.fieldNameSuffix).toStrictEqual('suffix');
    });

});
