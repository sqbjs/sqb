/* SQB
 ------------------------
 (c) 2017-present Panates
 SQB may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/sqb/
 */

module.exports.lowerCaseObjectKeys = function (obj) {
  Object.getOwnPropertyNames(obj).forEach(key => {
    const name = key.toLowerCase();
    if (name !== key) {
      obj[name] = obj[key];
      delete obj[key];
    }
  });
  return obj;
};

module.exports.upperCaseObjectKeys = function (obj) {
  Object.getOwnPropertyNames(obj).forEach(key => {
    const name = key.toUpperCase();
    if (name !== key) {
      obj[name] = obj[key];
      delete obj[key];
    }
  });
  return obj;
};
