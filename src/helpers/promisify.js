/* SQB
 ------------------------
 (c) 2017-present Panates
 SQB may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/sqb/
 */

const Promisify = {

  fromCallback: function(resolver) {
    return new Promisify.Promise((resolve, reject) => {
      resolver((error, value) => {
        if (error)
          reject(error);
        else resolve(value);
      });
    });
  }

};

Promisify.Promise = Promise;

module.exports = Promisify;
