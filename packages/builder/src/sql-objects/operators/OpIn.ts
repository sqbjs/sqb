import {CompOperator} from './CompOperator';
import {OperatorType} from '../../enums';
import {isSerializable} from '../../typeguards';

export class OpIn extends CompOperator {

    _operatorType = OperatorType.in;
    _symbol = 'in';

    constructor(left, right) {
        super(left,
            Array.isArray(right) || isSerializable(right) ? right : [right]);
    }

    protected __serialize(ctx, o) {
        if (Array.isArray(o.right) && !o.right.length)
            return '';
        return super.__serialize(ctx, o);
    }

}
