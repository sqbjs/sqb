/**
 * Internal module dependencies.
 */

const SqlObject = require('./abstract');

/**
 * External module dependencies.
 */


/**
 * @class
 * @public
 */

class ConditionGroup extends SqlObject {

    constructor(src) {
        super();
        this._items = [];
        this.logicalOperator = 'and';
        if (src)
            this.add(src);
    }

    add(arr) {
        for (let i = 0; i < arguments.length; i++) {
            let arg = arguments[i];
            if (!arg.isCondition || arg.isConditionGroup)
                throw new Error('Only array of Condition instance allowed');
            this._items.push(arg);
        }
    }

    get length() {
        return this._items.length;
    }

    item(index) {
        return this._items[index];
    }

    get isConditionGroup() {
        return true;
    }

}

module.exports = ConditionGroup;