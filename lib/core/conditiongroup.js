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
        let self = this,
            logop = this.logicalOperator;
        for (let arg of arguments) {

            // Process array argument
            if (Array.isArray(arg) && arg.length) {
                // if First item is array, it is a group
                if (Array.isArray(arg[0])) {
                    let c = Reflect.construct(ConditionGroup, arg);
                    c.logicalOperator = logop;
                    self._items.push(c);
                } else if (typeof arg[0] === 'string' || arg[0].type === 'select' || arg[0].type === 'raw') {
                    let c = Reflect.construct(Condition, arg);
                    c.logicalOperator = logop;
                    self._items.push(c);
                } else throw new TypeError('Invalid argument');
            } else if (arg === 'and' || arg === 'or') {
                logop = arg;
            } else
                throw new TypeError('Invalid argument');
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