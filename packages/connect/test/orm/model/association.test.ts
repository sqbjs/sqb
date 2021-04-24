/* eslint-disable @typescript-eslint/unbound-method,@typescript-eslint/no-unused-vars */
import '../../_support/env';
import * as assert from 'assert';
import {Column, ForeignIndex, PrimaryKey} from '@sqb/connect';
import {Association} from '@sqb/connect/src/orm/association';

class Country {
    @PrimaryKey()
    @Column()
    code: string;

    @Column()
    name: string;
}

class Customer {
    @PrimaryKey()
    @Column()
    id: number;

    @Column()
    countryCode: string;
}

describe('Association', function () {

    it(`should resolve source entity (entity class)`, async () => {
        const association = new Association('', Customer, Country);
        const target = await association.resolveSource();
        assert.strictEqual(target.ctor, Customer);
    });

    it(`should resolve target entity (entity class)`, async () => {
        const association = new Association('', () => Customer, () => Country);
        const target = await association.resolveTarget();
        assert.strictEqual(target.ctor, Country);
    });

    it(`should resolve source entity (entity class resolver function)`, async () => {
        const association = new Association('', () => Customer, () => Country);
        const target = await association.resolveSource();
        assert.strictEqual(target.ctor, Customer);
    });

    it(`should resolve target entity (entity class resolver function)`, async () => {
        const association = new Association('', () => Customer, () => Country);
        const target = await association.resolveTarget();
        assert.strictEqual(target.ctor, Country);
    });

    it(`should resolve source entity (async entity class resolver function)`, async () => {
        const association = new Association('', async () => Customer, async () => Country);
        const target = await association.resolveSource();
        assert.strictEqual(target.ctor, Customer);
    });

    it(`should resolve target entity (async entity class resolver function)`, async () => {
        const association = new Association('', async () => Customer, async () => Country);
        const target = await association.resolveTarget();
        assert.strictEqual(target.ctor, Country);
    });

    it(`should determine sourceColumn from target's primary index (camel-case)`, async () => {
        const association = new Association('', Customer, Country);
        assert.strictEqual(await association.resolveSourceColumnName(), 'countryCode');
    });

    it(`should determine sourceColumn from target's primary index (snake-case)`, async () => {
        class Customer2 {
            @Column()
                // eslint-disable-next-line camelcase
            country_code: string;
        }

        const association = new Association('', Customer2, Country);
        assert.strictEqual(await association.resolveSourceColumnName(), 'country_code');
    });

    it(`should determine targetColumn using target's primary index`, async () => {
        const association = new Association('', Customer, Country);
        assert.strictEqual(await association.resolveTargetColumnName(), 'code');
    });

    it(`should determine keyColumn and targetColumn using target's foreign keys`, async () => {

        @ForeignIndex(() => Customer2, {keyColumn: 'idOfCustomer', targetColumn: 'id'})
        class CustomerPhone {
            @Column()
            idOfCustomer: number;
        }

        @ForeignIndex(CustomerPhone)
        class Customer2 {

        }

        const association = new Association('', Customer2, CustomerPhone);
        assert.strictEqual(await association.resolveSourceColumnName(), 'id');
        assert.strictEqual(await association.resolveTargetColumnName(), 'idOfCustomer');
    });

    it(`should determine keyColumn if there is no foreign-key`, async () => {
        @ForeignIndex(Country)
        class Customer2 {
            @Column()
            countryCode: string;
        }

        const association = new Association('', Customer2, Country);
        assert.strictEqual(await association.resolveSourceColumnName(), 'countryCode');
    });

    it(`should determine targetColumn from target primary index`, async () => {
        @ForeignIndex(Country)
        class Customer2 {
            @Column()
            countryCode: string;
        }

        const association = new Association('', Customer2, Country);
        assert.strictEqual(await association.resolveTargetColumnName(), 'code');
    });
});
