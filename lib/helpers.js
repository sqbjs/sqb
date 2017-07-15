/* SQB
 ------------------------
 (c) 2017-present Panates
 SQB may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/sqb/
 */

module.exports.lowerCaseObjectKeys = function (obj) {
  const o = {};
  Object.getOwnPropertyNames(obj).forEach(key => {
    o[key.toLowerCase()] = obj[key];
  });
  return o;
};

module.exports.upperCaseObjectKeys = function (obj) {
  const o = {};
  Object.getOwnPropertyNames(obj).forEach(key => {
    o[key.toUpperCase()] = obj[key];
  });
  return o;
};
