/* eslint-disable @typescript-eslint/unbound-method,@typescript-eslint/no-unused-vars */
import '../../_support/env';
import * as assert from 'assert';
import {BeforeUpdate, Entity} from '@sqb/connect';

describe('BeforeUpdate()', function () {

    it(`should define before-update event`, () => {
        class MyEntity {
            @BeforeUpdate()
            doBeforeUpdate(): void {
                //
            }
        }

        const meta = Entity.getMetadata(MyEntity);
        assert.ok(meta);
        assert.strictEqual(meta.name, 'MyEntity');
        assert.strictEqual(meta.eventListeners.length, 1);
        assert.strictEqual(meta.eventListeners[0].event, 'before-update');
        assert.strictEqual(meta.eventListeners[0].fn, MyEntity.prototype.doBeforeUpdate);
    });

    it(`should throw error on invalid argument`, () => {
        assert.throws(() => {
            // noinspection JSUnusedLocalSymbols
            class MyEntity {
                @BeforeUpdate()
                notAFunction: 12
            }
        }, /Property must be a function/);

    });

});
