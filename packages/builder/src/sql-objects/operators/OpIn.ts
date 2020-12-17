import {CompOperator} from './CompOperator';
import {OperatorType} from '../../enums';
import {isSerializable} from '../../typeguards';

export class OpIn extends CompOperator {

    _operatorType = OperatorType.in;
    _symbol = 'in';

    constructor(expression, value) {
        super(expression,
            Array.isArray(value) || isSerializable(value) ? value : [value]);
    }

    protected __serialize(ctx, o) {
        if (Array.isArray(o.value) && !o.value.length)
            return '';
        return super.__serialize(ctx, o);
    }

}
