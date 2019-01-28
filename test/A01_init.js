/* eslint-disable */
'use strict';

const assert = require('assert');
const sqb = require('../');
const extensions = require('../lib/extensions');

describe('Serializer', function() {

  it('should register serialization extension', () => {
    sqb.use(require('./support/test_serializer'));
    assert(extensions.items);
    assert.strictEqual(extensions.items.length, 1);
  });

  it('should register serialization extension', () => {
    sqb.use(require('./support/test_adapter'));
    assert.strictEqual(extensions.items.length, 2);
    assert(extensions.stringify);
  });

});
