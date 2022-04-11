import {OperatorType} from '../../enums';
import {Serializable} from '../../Serializable';
import {CompOperator} from './CompOperator';

export class OpGt extends CompOperator {

    _operatorType = OperatorType.gt;
    _symbol = '>';

    constructor(left: string | Serializable, right?: any) {
        super(left, right);
    }

}
