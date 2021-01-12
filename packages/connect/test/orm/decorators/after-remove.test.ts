/* eslint-disable @typescript-eslint/unbound-method,@typescript-eslint/no-unused-vars */
import '../../_support/env';
import * as assert from 'assert';
import {AfterDestroy, Entity} from '@sqb/connect';

describe('AfterRemove()', function () {

    it(`should define after-destroy event`, () => {
        class MyEntity {
            @AfterDestroy()
            doAfterDestroy(): void {
                //
            }
        }

        const meta = Entity.getMetadata(MyEntity);
        assert.ok(meta);
        assert.strictEqual(meta.name, 'MyEntity');
        assert.strictEqual(meta.eventListeners.length, 1);
        assert.strictEqual(meta.eventListeners[0].event, 'after-destroy');
        assert.strictEqual(meta.eventListeners[0].fn, MyEntity.prototype.doAfterDestroy);
    });

    it(`should throw error on invalid argument`, () => {
        assert.throws(() => {
            // noinspection JSUnusedLocalSymbols
            class MyEntity {
                @AfterDestroy()
                notAFunction: 12
            }
        }, /Property must be a function/);

    });

});
