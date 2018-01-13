/* SQB
 ------------------------
 (c) 2017-present Panates
 SQB may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/sqb/
 */

/**
 * ParamType
 * @export @enum {number}
 */
const ParamType = {};

/** @export */
ParamType.COLON = /** @type {!ParamType} */ (0);

/** @export */
ParamType.QUESTION_MARK = /** @type {!ParamType} */ (1);

/** @export */
ParamType.DOLLAR = /** @type {!ParamType} */ (2);

/** @export */
ParamType.AT = /** @type {!ParamType} */ (3);

/**
 * JoinType
 * @export @enum {number}
 */
const JoinType = {};

/** @export */
JoinType.INNER = /** @type {!JoinType} */ (0);

/** @export */
JoinType.LEFT = /** @type {!JoinType} */ (1);

/** @export */
JoinType.LEFT_OUTER = /** @type {!JoinType} */ (2);

/** @export */
JoinType.RIGHT = /** @type {!JoinType} */ (3);

/** @export */
JoinType.RIGHT_OUTER = /** @type {!JoinType} */ (4);

/** @export */
JoinType.OUTER = /** @type {!JoinType} */ (5);

/** @export */
JoinType.FULL_OUTER = /** @type {!JoinType} */ (6);

/**
 * Expose Module
 */
module.exports = {
  JoinType: JoinType,
  ParamType: ParamType
};

