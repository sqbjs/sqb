/* eslint-disable @typescript-eslint/unbound-method,@typescript-eslint/no-unused-vars */
import '../../_support/env';
import * as assert from 'assert';
import {BeforeInsert, Entity} from '@sqb/connect';

describe('BeforeInsert()', function () {

    it(`should define before-insert event`, () => {
        class MyEntity {
            @BeforeInsert()
            doBeforeInsert(): void {
                //
            }
        }

        const meta = Entity.getMetadata(MyEntity);
        assert.ok(meta);
        assert.strictEqual(meta.name, 'MyEntity');
        assert.strictEqual(meta.eventListeners.length, 1);
        assert.strictEqual(meta.eventListeners[0].event, 'before-insert');
        assert.strictEqual(meta.eventListeners[0].fn, MyEntity.prototype.doBeforeInsert);
    });

    it(`should throw error on invalid argument`, () => {
        assert.throws(() => {
            // noinspection JSUnusedLocalSymbols
            class MyEntity {
                @BeforeInsert()
                notAFunction: 12
            }
        }, /Property must be a function/);
    });

});
