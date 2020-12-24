import {CompOperator} from './CompOperator';
import {Serializable, serializeFallback, serializeObject} from '../../Serializable';
import {OperatorType} from '../../enums';
import {SerializeContext} from '../../types';

export class OpBetween extends CompOperator {

    _operatorType = OperatorType.between;
    _symbol = 'between'

    constructor(left: string | Serializable, right: any[]) {
        super(left, right);
        if (right && right[1] == null)
            right[1] = right[0];
    }

    protected __serialize(ctx: SerializeContext, o: any): string {
        o.right = o.right.map(x => serializeObject(ctx, x));
        return serializeFallback(ctx, this._type, o,
            (_ctx: SerializeContext, _o) => this.__defaultSerialize(_ctx, _o));
    }

    __defaultSerialize(ctx, o) {
        return o.left + ' ' + o.symbol + ' ' + o.right[0] + ' and ' + o.right[1];
    }

}
