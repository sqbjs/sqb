/* eslint-disable */
/* Internal module dependencies. */
const TestConnection = require('./test_connection');

class TestPool {

  constructor() {
  }

  //noinspection JSUnusedGlobalSymbols
  /**
   *
   * @param {Function<Error, Connection>} callback
   * @protected
   * @override
   */
  connect(callback) {
    callback(undefined, new TestConnection(this));
  }

  close(callback) {
    callback();
  }

  test(callback) {
    callback();
  }

}

module.exports = {
  createPool(cfg) {
    if (cfg.dialect === 'test') {
      return new TestPool(cfg);
    }
  }
};
