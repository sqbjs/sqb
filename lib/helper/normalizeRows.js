/* SQB
 ------------------------
 (c) 2017-present Panates
 SQB may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/sqb/
 */

function lowerCaseObjectKeys(obj) {
  for (const key of Object.getOwnPropertyNames(obj)) {
    const name = key.toLowerCase();
    if (name !== key) {
      obj[name] = obj[key];
      delete obj[key];
    }
  }
  return obj;
}

/* istanbul ignore next: Same as lowercase test*/
function upperCaseObjectKeys(obj) {
  for (const key of Object.getOwnPropertyNames(obj)) {
    const name = key.toUpperCase();
    if (name !== key) {
      obj[name] = obj[key];
      delete obj[key];
    }
  }
  return obj;
}

function normalizeRows(rows, options) {
  if (rows && rows.length && !Array.isArray(rows[0]) &&
      (options.naming || options.ignoreNulls || options.fetchAsString)) {
    for (const row of rows) {
      // Apply naming rule to rows
      if (options.naming === 'lowercase')
        lowerCaseObjectKeys(row);
      else
      /* istanbul ignore next: Same as lowercase test*/
      if (options.naming === 'uppercase')
        upperCaseObjectKeys(row);

      if (options.ignoreNulls || options.fetchAsString) {
        for (const key of Object.getOwnPropertyNames(row)) {
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
        }
      }
    }
  }
}

module.exports = normalizeRows;
