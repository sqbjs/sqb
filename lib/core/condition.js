/* SQB.js
 ------------------------
 (c) 2017-present Panates
 SQB may be freely distributed under the MIT license.
 For details and documentation:
 https://panates.github.io/sqb/
 */

/* Internal module dependencies. */

const SqlObject = require('./abstract');


/**
 * @class
 * @public
 */

class Condition extends SqlObject {

    constructor(field, operator, value, value2) {
        super();
        this.type = 'condition';
        this.field = field;
        this.logicalOperator = 'and';
        this.operator = '=';
        this.param = undefined;
        if (arguments.length === 2) {
            this.value = operator;
        } else {
            this.operator = operator || '=';
            this.value = value;
            if (this.operator === 'between' && !(value instanceof RegExp))
                this.value = Array.isArray(value) ? value : [value, value2];
        }
    }

    get isCondition() {
        return true;
    }

    get field() {
        return this._field;
    }

    set field(val) {
        this._field = val;
    }

    get param() {
        return this._param;
    }

    set param(val) {
        return this._param = val;
    }

    get value() {
        return this._value;
    }

    set value(val) {
        if (val instanceof RegExp) {
            this._value = undefined;
            this._param = val.source;
        } else {
            this._param = undefined;
            this._value = val;
        }
    }

    get operator() {
        return this._operator;
    }

    set operator(operator) {
        if (Condition.Operators.indexOf(operator) < 0)
            throw new Error(`Invalid comparison operator "${operator}"`);
        this._operator = operator;
    }

}

Condition.Operators = ['is', '=', '!=', '<', '>', '<=', '>=', '<>', '!<', '!>', 'like', 'between'];

module.exports = Condition;