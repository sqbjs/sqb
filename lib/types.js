/* SQB
 ------------------------
 (c) 2017-present Panates
 SQB may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/sqb/
 */

const DatasetMode = {
  NONE: 0,
  STATIC: 1,
  CURSOR: 2,
  CACHED: 3
};

const ParamType = {
  COLON: 1,
  QUESTION_MARK: 2,
  DOLLAR: 3
};

module.exports = {
  DatasetMode: DatasetMode,
  ParamType: ParamType
};

