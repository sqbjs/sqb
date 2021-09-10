import {Operator} from '../Operator';
import {Serializable, serializeFallback, serializeObject} from '../../Serializable';
import {SerializeContext} from '../../types';
import {SerializationType} from '../../enums';
import {isSelectQuery, isSerializable} from '../../typeguards';
import {Param} from '../../sqlobject.initializers';
import {ParamExpression} from '../ParamExpression';

const EXPRESSION_PATTERN = /^([\w\\.$]+)(\[])?/;

export abstract class CompOperator extends Operator {

    _expression: Serializable | string;
    _value?: any | Serializable;
    _symbol?: string;
    _isArray?: boolean;

    protected constructor(expression: string | Serializable, value?: any) {
        super();
        if (typeof expression === 'string') {
            const m = expression.match(EXPRESSION_PATTERN);
            if (!m)
                throw new TypeError(`"${expression}" is not a valid expression definition`);
            this._expression = m[1];
            this._isArray = !!m[2];
        } else
            this._expression = expression;
        this._value = value;
    }

    get _type(): SerializationType {
        return SerializationType.COMPARISON_EXPRESSION;
    }

    _serialize(ctx: SerializeContext): string {
        const left = this._expression instanceof Serializable ?
            this._expression._serialize(ctx) : this._expression;
        let right = this._value;
        if (ctx.strictParams && !isSerializable(right) &&
            typeof this._expression === 'string') {
            ctx.strictParamGenId = ctx.strictParamGenId || 0;
            const name = 'strictParam$' + ++ctx.strictParamGenId;
            right = Param(name);
            ctx.params = ctx.params || {};
            ctx.params[name] = this._value;
        }

        const o: any = {
            operatorType: this._operatorType,
            left: isSelectQuery(this._expression) ?
                '(' + left + ')' : left,
            symbol: this._symbol,
            right,
            isArray: this._isArray,
            paramValue: ctx.params ?
                (right instanceof ParamExpression ?
                    ctx.params[right._name] : ctx.params[left.toLowerCase()])
                : undefined
        };

        return this.__serialize(ctx, o);
    }

    protected __serialize(ctx: SerializeContext, o: any): string {
        let value = serializeObject(ctx, o.right);
        if (isSelectQuery(o.right))
            value = '(' + value + ')';
        o.right = value;
        return serializeFallback(ctx, this._type, o,
            (_ctx: SerializeContext, _o) => this.__defaultSerialize(_ctx, _o));
    }

    protected __defaultSerialize(ctx: SerializeContext, o: any): string {
        return (Array.isArray(o.expression) ?
                '(' + o.left.join(',') + ')' : o.left) +
            ' ' + o.symbol + ' ' + o.right;
    }

}
