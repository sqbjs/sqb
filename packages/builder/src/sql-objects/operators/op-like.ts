import {OperatorType} from '../../enums.js';
import {Serializable} from '../../serializable.js';
import {SerializeContext} from '../../serialize-context.js';
import {isSerializable} from '../../typeguards.js';
import {CompOperator} from './comp-operator.js';

export class OpLike extends CompOperator {

    _operatorType = OperatorType.like;
    _symbol = 'like';

    constructor(left: string | Serializable, right?: any) {
        super(left, right);
    }

    protected __serialize(ctx: SerializeContext, o: any): string {
        if (o.right && typeof o.right !== 'string' && !isSerializable(o.right))
            o.right = ctx.anyToSQL(o.right);
        if (!o.right)
            return '';
        o.right = ctx.anyToSQL(o.right);
        return ctx.serialize(this._type, o,
            (_ctx: SerializeContext, _o) => this.__defaultSerialize(_ctx, _o));
    }


}
