/* eslint-disable @typescript-eslint/unbound-method,@typescript-eslint/no-unused-vars */
import '../../_support/env';
import * as assert from 'assert';
import {BeforeDestroy, Entity} from '@sqb/connect';

describe('BeforeDestroy()', function () {

    it(`should define before-destroy event`, () => {
        class MyEntity {
            @BeforeDestroy()
            doBeforeDestroy(): void {
                //
            }
        }

        const meta = Entity.getMetadata(MyEntity);
        assert.ok(meta);
        assert.strictEqual(meta.name, 'MyEntity');
        assert.strictEqual(meta.eventListeners.length, 1);
        assert.strictEqual(meta.eventListeners[0].event, 'before-destroy');
        assert.strictEqual(meta.eventListeners[0].fn, MyEntity.prototype.doBeforeDestroy);
    });

    it(`should throw error on invalid argument`, () => {
        assert.throws(() => {
            // noinspection JSUnusedLocalSymbols
            class MyEntity {
                @BeforeDestroy()
                notAFunction: 12
            }
        }, /Property must be a function/);

    });

});
