import {Operator} from '../Operator';
import {Serializable, serializeFallback, serializeObject} from '../../Serializable';
import {Query} from '../../query/Query';
import {SerializeContext} from '../../interfaces';
import {SerializationType} from '../../enums';

export abstract class CompOperator extends Operator {

    _expression: Serializable | string;
    _value?: any | Serializable;
    _symbol?: string;

    protected constructor(expression: string | Serializable, value?: any) {
        super();
        this._expression = expression;
        this._value = value;
    }

    get _type(): SerializationType {
        return SerializationType.COMPARISON_EXPRESSION;
    }

    _serialize(ctx: SerializeContext): string {
        const expression = this._expression instanceof Serializable ?
            this._expression._serialize(ctx) : this._expression;
        const o: any = {
            operatorType: this._operatorType,
            expression: this._expression instanceof Query ?
                '(' + expression + ')' : expression,
            symbol: this._symbol,
            value: this._value
        };

        return this.__serialize(ctx, o);
    }

    protected __serialize(ctx: SerializeContext, o: any): string {
        let value = serializeObject(ctx, o.value);
        if (o.value as unknown instanceof Query)
            value = '(' + value + ')';
        o.value = value;
        return serializeFallback(ctx, this._type, o,
            (_ctx: SerializeContext, _o) => this.__defaultSerialize(_ctx, _o));
    }

    protected __defaultSerialize(ctx: SerializeContext, o: any): string {
        return (Array.isArray(o.expression) ?
            '(' + o.expression.join(',') + ')' : o.expression) +
            ' ' + o.symbol + ' ' + o.value;
    }

}
