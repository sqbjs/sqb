import {OperatorType} from '../../enums';
import {Serializable} from '../../Serializable';
import {CompOperator} from './CompOperator';

export class OpLt extends CompOperator {

    _operatorType = OperatorType.lt;
    _symbol = '<';

    constructor(left: string | Serializable, right?: any) {
        super(left, right);
    }

}
