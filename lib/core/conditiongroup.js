/* SQB.js
 ------------------------
 (c) 2017-present Panates
 SQB may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/sqb/
 */

/* Internal module dependencies. */

const SqlObject = require('./abstract');
const Condition = require('./condition');
const isPlainObject = require('../helpers/helpers').isPlainObject;


/**
 * @class
 * @public
 */

class ConditionGroup extends SqlObject {

    constructor(...src) {
        super();
        this._items = [];
        this.logicalOperator = 'and';
        if (arguments.length > 0)
            this.add(...src);
    }

    add(arr) {
        let self = this;
        for (let arg of arguments) {
            if (arg.isCondition || arg.isConditionGroup || arg.isRaw)
                self._items.push(arg);
            else if (isPlainObject(arg)) {
                Object.getOwnPropertyNames(arg).forEach(function (key) {
                    self._items.push(new Condition(key, arg[key]))
                });
            }
            else throw new Error('Only array of Condition instance allowed');
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