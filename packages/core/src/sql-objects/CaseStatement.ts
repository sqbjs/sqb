import {Serializable, serializeFallback, serializeObject} from '../Serializable';
import {SerializationType} from '../enums';
import {LogicalOperator} from './operators/LogicalOperator';
import {OpAnd} from './operators/OpAnd';
import {SerializeContext} from '../interfaces';
import {Operator} from './Operator';
import {RawStatement} from './RawStatement';

export class CaseStatement extends Serializable {

    _expressions: { condition: Serializable, value: any }[];
    _elseValue: any;
    _condition?: LogicalOperator;
    _alias?: string;

    constructor() {
        super();
        this._expressions = [];
    }

    get _type(): SerializationType {
        return SerializationType.CASE_EXPRESSION;
    }

    /**
     * Defines "when" part of Case expression.
     */
    when(...condition: (Operator | RawStatement)[]): this {
        if (condition.length)
            this._condition = new OpAnd(...condition);
        else this._condition = undefined;
        return this;
    }

    /**
     * Defines "then" part of Case expression.
     */
    then(value): this {
        if (this._condition)
            this._expressions.push({
                condition: this._condition,
                value
            });
        return this;
    }

    /**
     * Defines "else" part of Case expression.
     */
    else(value): this {
        this._elseValue = value;
        return this;
    }

    /**
     * Sets alias to case expression.
     */
    as(alias: string): this {
        this._alias = alias;
        return this;
    }

    /**
     * Performs serialization
     *
     * @param {Object} ctx
     * @return {string}
     * @override
     */
    _serialize(ctx: SerializeContext): string {
        if (!this._expressions.length)
            return '';
        const q = {
            expressions: [] as any,
            elseValue: this._elseValue !== undefined ?
                serializeObject(ctx, this._elseValue) : undefined
        };
        for (const x of this._expressions) {
            const o = {
                condition: x.condition._serialize(ctx),
                value: serializeObject(ctx, x.value)
            };
            q.expressions.push(o);
        }

        return serializeFallback(ctx, this._type, q,
            () => this.__defaultSerialize(ctx, q));
    }

    protected __defaultSerialize(ctx: SerializeContext, o: any): string {
        let out = 'case\n\t';
        for (const x of o.expressions) {
            out += 'when ' + x.condition + ' then ' + x.value + '\n';
        }
        if (o.elseValue !== undefined)
            out += 'else ' + o.elseValue + '\n';
        out += '\bend' + (this._alias ? ' ' + this._alias : '');
        return out;
    }

}
