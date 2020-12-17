import {CompOperator} from './CompOperator';
import {OperatorType} from '../../enums';
import {Serializable, serializeFallback, serializeObject} from '../../Serializable';
import {SerializeContext} from '../../types';
import {isSerializable} from '../../typeguards';

export class OpLike extends CompOperator {

    _operatorType = OperatorType.like;
    _symbol = 'like';

    constructor(expression: string | Serializable, value?: any) {
        super(expression, value);
    }

    protected __serialize(ctx: SerializeContext, o: any): string {
        if (o.value && typeof o.value !== 'string' && !isSerializable(o.value))
            o.value = serializeObject(ctx, o.value);
        if (!o.value)
            return '';
        o.value = serializeObject(ctx, o.value);
        return serializeFallback(ctx, this._type, o,
            (_ctx: SerializeContext, _o) => this.__defaultSerialize(_ctx, _o));
    }


}
