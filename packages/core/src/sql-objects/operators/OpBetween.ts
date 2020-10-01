import {CompOperator} from './CompOperator';
import {Serializable, serializeFallback, serializeObject} from '../../Serializable';
import {OperatorType} from '../../enums';
import {SerializeContext} from '../../types';

export class OpBetween extends CompOperator {

    _operatorType = OperatorType.between;
    _symbol = 'between'

    constructor(expression: string | Serializable, values: any[]) {
        super(expression, values);
        if (values && values[1] == null)
            values[1] = values[0];
    }

    protected __serialize(ctx: SerializeContext, o: any): string {
        o.value = o.value.map(x => serializeObject(ctx, x));
        return serializeFallback(ctx, this._type, o,
            (_ctx: SerializeContext, _o) => this.__defaultSerialize(_ctx, _o));
    }

    __defaultSerialize(ctx, o) {
        return o.expression + ' ' + o.symbol + ' ' + o.value[0] + ' and ' + o.value[1];
    }

}
