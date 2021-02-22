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

    it(`should @ForeignKey(type, options) class decorator add a foreign key metadata`, () => {
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

    it(`should resolve target entity if target is a resolver function`, async () => {
        @ForeignIndex(async () => Country)
        class Customer {
            @Column()
            countryCode: string;
        }

        const meta = Entity.getMetadata(Customer);
        assert.ok(meta);
        assert.strictEqual(meta.foreignKeys.length, 1);
        const target = await meta.foreignKeys[0].resolveTarget();
        assert.strictEqual(target.ctor, Country);
    });

    it(`should detect keyColumn using target's primary column if not explicitly defined (camel-case)`, async () => {
        @ForeignIndex(Country)
        class Customer {
            @Column()
            countryCode: string;
        }

        const meta = Entity.getMetadata(Customer);
        assert.ok(meta);
        assert.strictEqual(meta.foreignKeys.length, 1);
        assert.strictEqual(await meta.foreignKeys[0].resolveKeyColumnName(), 'countryCode');
    });

    it(`should detect keyColumn using target's primary column if not explicitly defined (snake-case)`, async () => {
        @ForeignIndex(Country)
        class Customer {
            @Column()
                // eslint-disable-next-line camelcase
            country_code: string;
        }

        const meta = Entity.getMetadata(Customer);
        assert.ok(meta);
        assert.strictEqual(meta.foreignKeys.length, 1);
        assert.strictEqual(await meta.foreignKeys[0].resolveKeyColumnName(), 'country_code');
    });

    it(`should detect targetColumn using target's primary column if not explicitly defined`, async () => {

        @ForeignIndex(Country)
        class Customer {
            @Column()
            countryCode: string;
        }

        const meta = Entity.getMetadata(Customer);
        assert.ok(meta);
        assert.strictEqual(meta.foreignKeys.length, 1);
        assert.strictEqual((await meta.foreignKeys[0].resolveTargetColumn()).name, 'code');
    });

    it(`should detect keyColumn and targetColumn  using target's foreign keys`, async () => {

        @ForeignIndex(() => Customer, {keyColumn: 'idOfCustomer', targetColumn: 'id'})
        class CustomerPhone {
            @Column()
            idOfCustomer: number;
        }

        @ForeignIndex(CustomerPhone)
        class Customer {

        }

        const meta = Entity.getMetadata(Customer);
        assert.ok(meta);
        assert.strictEqual(meta.foreignKeys.length, 1);
        assert.strictEqual(await meta.foreignKeys[0].resolveKeyColumnName(), 'id');
        assert.strictEqual(await meta.foreignKeys[0].resolveTargetColumnName(), 'idOfCustomer');
    });

    it(`should auto determine keyColumn if there is no foreign-key`, async () => {
        @ForeignIndex(Country)
        class Customer {
            @Column()
            countryCode: string;
        }

        const meta = Entity.getMetadata(Customer);
        assert.ok(meta);
        assert.strictEqual(meta.foreignKeys.length, 1);
        assert.strictEqual(await meta.foreignKeys[0].resolveKeyColumnName(), 'countryCode');
    });

    it(`should detect targetColumn from target primary index`, async () => {
        @ForeignIndex(Country)
        class Customer {
            @Column()
            countryCode: string;
        }

        const meta = Entity.getMetadata(Customer);
        assert.ok(meta);
        assert.strictEqual(meta.foreignKeys.length, 1);
        assert.strictEqual(await meta.foreignKeys[0].resolveTargetColumnName(), 'code');
    });

});
