/* SQB
 ------------------------
 (c) 2017-present Panates
 SQB may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/sqb/
 */

function promisify(resolver) {
  return new promisify.Promise((resolve, reject) => {
    try {
      resolver((error, value) => {
        if (error)
          reject(error);
        else resolve(value);
      });
    } catch (e) {
      reject(e);
    }
  });
}

promisify.Promise = Promise;

module.exports = promisify;
