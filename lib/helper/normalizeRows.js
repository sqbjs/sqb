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
      (options.naming || options.ignoreNulls || options.coercion)) {
    for (const row of rows) {
      // Apply naming rule to rows
      if (options.naming === 'lowercase')
        lowerCaseObjectKeys(row);
      else
      /* istanbul ignore next: Same as lowercase test*/
      if (options.naming === 'uppercase')
        upperCaseObjectKeys(row);

      if (options.ignoreNulls || options.coercion) {
        for (const key of Object.keys(row)) {
          if (options.coercion) {
            const v = options.coercion(key, row[key]);
            if (v !== undefined)
              row[key] = v;
          }
          if (options.ignoreNulls && row[key] === null)
            delete row[key];
        }
      }
    }
  }
}

module.exports = normalizeRows;
