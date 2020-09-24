import assert from 'assert';
import {PluginRegistry} from '@sqb/core';

describe('Plugin Registry', function () {

    it('should register serialization extension', () => {
        PluginRegistry.register(require('./_support/test_serializer'));
        assert(PluginRegistry.items);
        assert.strictEqual(PluginRegistry.items.length, 1);
    });

});
