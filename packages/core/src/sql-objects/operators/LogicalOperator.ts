import {Operator} from '../Operator';
import isPlainObject from 'putil-isplainobject';
import {RawStatement} from '../RawStatement';
import {SerializationType} from '../../enums';
import {printArray, Serializable, serializeFallback} from '../../Serializable';
import {SerializeContext} from '../../interfaces';

export const WrapOps = {};

export abstract class LogicalOperator extends Operator {

    protected _items: Serializable[] = [];

    constructor(...operator: (Operator | RawStatement)[]) {
        super();
        this.add(...operator);
    }

    get _type(): SerializationType {
        return SerializationType.LOGICAL_EXPRESSION;
    }

    /**
     * Adds operator(s) to item list
     */
    add(...operator: Serializable[]): this {
        for (const arg of operator) {
            if (!arg) continue;
            if (isPlainObject(arg)) {
                this.add(...this._wrapObject(arg));
                continue;
            }
            if (!(arg instanceof Operator || arg._type === SerializationType.RAW))
                throw new TypeError('Operator or Raw type required');
            this._items.push(arg);
        }
        return this;
    }

    _serialize(ctx: SerializeContext): string {
        const arr: string[] = [];
        for (const t of this._items) {
            const s: string = t._serialize(ctx);
            /* istanbul ignore else */
            if (s) {
                arr.push(t._type === SerializationType.LOGICAL_EXPRESSION ? '(' + s + ')' : s);
            }
        }
        return serializeFallback(ctx, 'operator', arr, () => {
            const s = printArray(arr, ' ' + String(this._operatorType));
            return (s.indexOf('\n') > 0) ? s.replace('\n', '\n\t') + '\b' : s;
        });
    }

    private _wrapObject(obj): Serializable[] {
        const result: Serializable[] = [];
        for (const n of Object.getOwnPropertyNames(obj)) {
            let op;
            const v = obj[n];
            if (['and', 'or'].includes(n.toLowerCase())) {
                op = WrapOps[n.toLowerCase()];
                if (!op)
                    throw new Error(`Unknown operator "${n}"`);
                result.push(Array.isArray(v) ? op(...v) : op(v));
                continue;
            }
            if (['exists', '!exists'].includes(n))
                result.push(WrapOps[n](obj[n]));
            else {
                const m = n.match(/^([\w\\.$]+) *(.*)$/);
                if (!m)
                    throw new TypeError(`"${n}" is not a valid definition`);
                op = WrapOps[m[2] || 'eq'];
                if (!op)
                    throw new Error(`Unknown operator "${m[2]}"`);
                result.push(op(m[1], obj[n]));
            }
        }
        return result;
    }
}
