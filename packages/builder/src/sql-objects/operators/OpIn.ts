import {CompOperator} from './CompOperator';
import {OperatorType} from '../../enums';
import {Serializable} from '../../Serializable';

export class OpIn extends CompOperator {

    _operatorType = OperatorType.in;
    _symbol = 'in';

    constructor(expression, value) {
        super(expression, Array.isArray(value) || value instanceof Serializable ?
            value : [value]);
    }

    protected __serialize(ctx, o) {
        if (Array.isArray(o.value) && !o.value.length)
            return '';
        return super.__serialize(ctx, o);
    }

}