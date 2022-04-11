import {OperatorType} from '../../enums';
import {SerializeContext} from '../../SerializeContext';
import {isSerializable} from '../../typeguards';
import {CompOperator} from './CompOperator';

export class OpIn extends CompOperator {

    _operatorType = OperatorType.in;
    _symbol = 'in';

    constructor(left, right) {
        super(left,
            Array.isArray(right) || isSerializable(right) ? right : [right]);
    }

    _serialize(ctx: SerializeContext): string {
        if (Array.isArray(this._right) && !this._right.length)
            return '';
        return super._serialize(ctx);
    }

}
