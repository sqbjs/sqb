import {CompOperator} from './CompOperator';
import {OperatorType} from '../../enums';
import {isSerializable} from '../../typeguards';
import {SerializeContext} from '../../SerializeContext';

export class OpIn extends CompOperator {

    _operatorType = OperatorType.in;
    _symbol = 'in';

    constructor(left, right) {
        super(left,
            Array.isArray(right) || isSerializable(right) ? right : [right]);
    }

    _serialize(ctx: SerializeContext): string {
        if (Array.isArray(this._value) && !this._value.length)
            return '';
        return super._serialize(ctx);
    }

}
