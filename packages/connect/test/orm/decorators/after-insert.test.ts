/* eslint-disable @typescript-eslint/unbound-method,@typescript-eslint/no-unused-vars */
import '../../_support/env';
import * as assert from 'assert';
import {AfterInsert, Entity} from '@sqb/connect';

describe('AfterInsert()', function () {

    it(`should define after-insert event`, () => {
        class MyEntity {
            @AfterInsert()
            doAfterInsert(): void {
                //
            }
        }

        const meta = Entity.getMetadata(MyEntity);
        assert.ok(meta);
        assert.strictEqual(meta.name, 'MyEntity');
        assert.strictEqual(meta.eventListeners.length, 1);
        assert.strictEqual(meta.eventListeners[0].event, 'after-insert');
        assert.strictEqual(meta.eventListeners[0].fn, MyEntity.prototype.doAfterInsert);
    });

    it(`should throw error on invalid argument`, () => {
        assert.throws(() => {
            // noinspection JSUnusedLocalSymbols
            class MyEntity {
                @AfterInsert()
                notAFunction: 12
            }
        }, /Property must be a function/);

    });

});

