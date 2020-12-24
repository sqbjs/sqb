import {CompOperator} from './CompOperator';
import {OperatorType} from '../../enums';
import {Serializable, serializeFallback, serializeObject} from '../../Serializable';
import {SerializeContext} from '../../types';
import {isSerializable} from '../../typeguards';

export class OpLike extends CompOperator {

    _operatorType = OperatorType.like;
    _symbol = 'like';

    constructor(left: string | Serializable, right?: any) {
        super(left, right);
    }

    protected __serialize(ctx: SerializeContext, o: any): string {
        if (o.right && typeof o.right !== 'string' && !isSerializable(o.right))
            o.right = serializeObject(ctx, o.right);
        if (!o.right)
            return '';
        o.right = serializeObject(ctx, o.right);
        return serializeFallback(ctx, this._type, o,
            (_ctx: SerializeContext, _o) => this.__defaultSerialize(_ctx, _o));
    }


}
