/* eslint-disable @typescript-eslint/unbound-method,@typescript-eslint/no-unused-vars */
import '../../_support/env';
import * as assert from 'assert';
import {Association, Column, ForeignKey, PrimaryKey} from '@sqb/connect';

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
        const association = new Association('', {source: Customer, target: Country});
        const target = await association.resolveSource();
        assert.strictEqual(target.ctor, Customer);
    });

    it(`should resolve target entity (entity class)`, async () => {
        const association = new Association('', {source: Customer, target: Country});
        const target = await association.resolveTarget();
        assert.strictEqual(target.ctor, Country);
    });

    it(`should resolve source entity (entity class resolver function)`, async () => {
        const association = new Association('', {source: () => Customer, target: () => Country});
        const target = await association.resolveSource();
        assert.strictEqual(target.ctor, Customer);
    });

    it(`should resolve target entity (entity class resolver function)`, async () => {
        const association = new Association('', {source: () => Customer, target: () => Country});
        const target = await association.resolveTarget();
        assert.strictEqual(target.ctor, Country);
    });

    it(`should resolve source entity (async entity class resolver function)`, async () => {
        const association = new Association('', {source: async () => Customer, target: async () => Country});
        const target = await association.resolveSource();
        assert.strictEqual(target.ctor, Customer);
    });

    it(`should resolve target entity (async entity class resolver function)`, async () => {
        const association = new Association('', {source: async () => Customer, target: async () => Country});
        const target = await association.resolveTarget();
        assert.strictEqual(target.ctor, Country);
    });

    it(`should determine sourceKey from target's primary index (camel-case)`, async () => {
        const association = new Association('', {source: Customer, target: Country});
        assert.strictEqual(await association.resolveSourceKey(), 'countryCode');
    });

    it(`should determine sourceKey from target's primary index (snake-case)`, async () => {
        class Customer2 {
            @Column()
                // eslint-disable-next-line camelcase
            country_code: string;
        }

        const association = new Association('', {source: Customer2, target: Country});
        assert.strictEqual(await association.resolveSourceKey(), 'country_code');
    });

    it(`should determine targetKey using target's primary index`, async () => {
        const association = new Association('', {source: Customer, target: Country});
        assert.strictEqual(await association.resolveTargetKey(), 'code');
    });

    it(`should determine sourceKey and targetKey using target's foreign keys`, async () => {

        class CustomerPhone {
            @Column()
            @ForeignKey(() => Customer2)
            idOfCustomer: number;
        }

        class Customer2 {
            @PrimaryKey()
            id: string;
        }

        const association = new Association('', {source: Customer2, target: CustomerPhone});
        assert.strictEqual(await association.resolveSourceKey(), 'id');
        assert.strictEqual(await association.resolveTargetKey(), 'idOfCustomer');
    });

    it(`should determine keyColumn if there is no foreign-key`, async () => {
        class Customer2 {
            @Column()
            @ForeignKey(Country)
            countryCode: string;
        }

        const association = new Association('', {source: Customer2, target: Country});
        assert.strictEqual(await association.resolveSourceKey(), 'countryCode');
    });

    it(`should determine targetColumn from target primary index`, async () => {
        class Customer2 {
            @Column()
            @ForeignKey(Country)
            countryCode: string;
        }

        const association = new Association('', {source: Customer2, target: Country});
        assert.strictEqual(await association.resolveTargetKey(), 'code');
    });
});
