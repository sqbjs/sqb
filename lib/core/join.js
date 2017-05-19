/**
 * Internal module dependencies.
 */

const SqlObject = require('./abstract');
const ConditionGroup = require('./conditiongroup');

/**
 * @class
 * @public
 */

class Join extends SqlObject {

    constructor(joinType, table) {
        super();
        if (joinType < 0 || joinType > 6)
            throw new TypeError('Invalid argument (joinType) for join');
        if (!(typeof table === 'string' || table.isSelect))
            throw new TypeError('Invalid argument (table) for join');
        this.type = 'join';
        this.joinType = joinType;
        this.table = table;
        this.conditions = new ConditionGroup();
    }

    on(conditions) {
        this.conditions.add.apply(this.conditions, arguments);
        return this;
    }

}

/** @export @enum {number} */
Join.Type = {};

/** @export */
Join.Type.innerJoin = /** @type {!Join.Type} */ (0);

/** @export */
Join.Type.leftJoin = /** @type {!Join.Type} */ (1);

/** @export */
Join.Type.leftOuterJoin = /** @type {!Join.Type} */ (2);

/** @export */
Join.Type.rightJoin = /** @type {!Join.Type} */ (3);

/** @export */
Join.Type.rightOuterJoin = /** @type {!Join.Type} */ (4);

/** @export */
Join.Type.outerJoin = /** @type {!Join.Type} */ (5);

/** @export */
Join.Type.fullOuterJoin = /** @type {!Join.Type} */ (6);


module.exports = Join;