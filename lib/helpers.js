/* SQB
 ------------------------
 (c) 2017-present Panates
 SQB may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/sqb/
 */

function lowerCaseObjectKeys(obj) {
  Object.getOwnPropertyNames(obj).forEach(key => {
    const name = key.toLowerCase();
    if (name !== key) {
      obj[name] = obj[key];
      delete obj[key];
    }
  });
  return obj;
}

function upperCaseObjectKeys(obj) {
  Object.getOwnPropertyNames(obj).forEach(key => {
    const name = key.toUpperCase();
    if (name !== key) {
      obj[name] = obj[key];
      delete obj[key];
    }
  });
  return obj;
}

function normalizeRows(rows, options) {
  if (rows && rows.length && !Array.isArray(rows[0]) &&
      (options.naming || options.ignoreNulls)) {
    for (const row of rows) {
      // Apply naming rule to rows
      if (options.naming === 'lowercase')
        lowerCaseObjectKeys(row);
      else if (options.naming === 'uppercase')
        upperCaseObjectKeys(row);
      // Remove null properties of rows
      if (options.ignoreNulls)
        Object.getOwnPropertyNames(row).forEach(key => {
          if (row[key] === null)
            delete row[key];
        });
    }
  }
}

module.exports = {
  lowerCaseObjectKeys,
  upperCaseObjectKeys,
  normalizeRows
};
