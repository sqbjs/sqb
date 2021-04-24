/* eslint-disable @typescript-eslint/unbound-method,@typescript-eslint/no-unused-vars */
import '../../_support/env';
import * as assert from 'assert';
import {Column, Entity, ForeignIndex, PrimaryKey} from '@sqb/connect';

describe('ForeignIndex', function () {

    class Country {
        @PrimaryKey()
        @Column()
        code: string;

        @Column()
        name: string;
    }

    it(`should add foreign index into entity metadata`, () => {
        @ForeignIndex(Country, {keyColumn: 'countryCode', targetColumn: 'code', name: 'fk_customer_country_code'})
        class Customer {
            @Column()
            countryCode: string;
        }

        const meta = Entity.getMetadata(Customer);
        assert.ok(meta);
        assert.strictEqual(meta.foreignKeys.length, 1);
        assert.strictEqual(meta.foreignKeys[0].target, Country);
        assert.strictEqual(meta.foreignKeys[0].keyColumn, 'countryCode');
        assert.strictEqual(meta.foreignKeys[0].targetColumn, 'code');
        assert.strictEqual(meta.foreignKeys[0].name, 'fk_customer_country_code');
    });

});
