/* istanbul ignore next */
module.exports = function promisePolyfill() {
  if (typeof Promise.prototype.finally !== 'function') {
    // eslint-disable-next-line
    Promise.prototype.finally = function(fn) {
      if (typeof fn !== 'function')
        throw new Error('Promise.prototype.finally() requires a function argument');
      return this
          .then(value => Promise.resolve(fn()).then(() => value))
          .catch(reason => Promise.resolve(fn()).then(() => {
            throw reason;
          }));
    };
  }

  if (typeof Promise.try !== 'function') {
    Promise.try = function(fn) {
      if (typeof fn !== 'function')
        throw new Error('Promise.try() requires a function argument');
      try {
        return Promise.resolve(fn());
      } catch (e) {
        return Promise.reject(e);
      }
    };
  }
};
