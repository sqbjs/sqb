/* eslint-disable @typescript-eslint/unbound-method,@typescript-eslint/no-unused-vars */
import '../../_support/env';
import * as assert from 'assert';
import {AfterUpdate, Entity} from '@sqb/connect';

describe('AfterUpdate()', function () {

    it(`should define after-update event`, () => {
        class MyEntity {
            @AfterUpdate()
            doAfterUpdate(): void {
                //
            }
        }

        const meta = Entity.getMetadata(MyEntity);
        assert.ok(meta);
        assert.strictEqual(meta.name, 'MyEntity');
        assert.strictEqual(meta.eventListeners.length, 1);
        assert.strictEqual(meta.eventListeners[0].event, 'after-update');
        assert.strictEqual(meta.eventListeners[0].fn, MyEntity.prototype.doAfterUpdate);
    });

    it(`should throw error on invalid argument`, () => {
        assert.throws(() => {
            // noinspection JSUnusedLocalSymbols
            class MyEntity {
                @AfterUpdate()
                notAFunction: 12
            }
        }, /Property must be a function/);

    });

});
