/* SQB
 ------------------------
 (c) 2017-present Panates
 SQB may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/sqb/
 */

function lowerCaseObjectKeys(obj) {
  Object.getOwnPropertyNames(obj).forEach(function(key) {
    const name = key.toLowerCase();
    if (name !== key) {
      obj[name] = obj[key];
      delete obj[key];
    }
  });
  return obj;
}

function upperCaseObjectKeys(obj) {
  Object.getOwnPropertyNames(obj).forEach(function(key) {
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
      (options.naming || options.ignoreNulls || options.fetchAsString)) {
    rows.forEach(function(row) {
      // Apply naming rule to rows
      if (options.naming === 'lowercase')
        lowerCaseObjectKeys(row);
      else if (options.naming === 'uppercase')
        upperCaseObjectKeys(row);

      if (options.ignoreNulls || options.fetchAsString) {
        Object.getOwnPropertyNames(row).forEach(function(key) {
          if (options.ignoreNulls && row[key] === null)
            delete row[key];
          else if (options.fetchAsString) {
            if (row[key] instanceof Date &&
                options.fetchAsString.indexOf(Date) >= 0) {
              row[key] = row[key].toISOString();
            }
            if (typeof row[key] === 'number' &&
                options.fetchAsString.indexOf(Number) >= 0) {
              row[key] = String(row[key]);
            }
          }
        });
      }
    });
  }
}

module.exports = normalizeRows;
