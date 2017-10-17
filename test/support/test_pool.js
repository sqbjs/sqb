/* eslint-disable */
/* Internal module dependencies. */
const TestConnection = require('./test_connection');

function TestPool() {
}

const proto = TestPool.prototype = {};
proto.constructor = TestPool;

proto.connect = function(callback) {
  callback(undefined, new TestConnection(this));
};

proto.close = function(callback) {
  callback();
};

proto.test = function(callback) {
  callback();
};

module.exports = {
  createPool: function(cfg) {
    if (cfg.dialect === 'test') {
      return new TestPool(cfg);
    }
  }
};
