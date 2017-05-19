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

class Condition extends SqlObject {

    constructor(field, operator, value) {
        super();
        this.type = 'condition';
        this.field = field;
        this.logicalOperator = 'and';
        this.operator = '=';
        if (arguments.length === 2) {
            this.value = operator;
        } else {
            this.value = value;
            this.operator = operator;
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

Condition.Operators = ['is', '=', '!=', '<', '>', '<=', '>=', '<>', '!<', '!>'];

module.exports = Condition;