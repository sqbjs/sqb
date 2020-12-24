import {CompOperator} from './CompOperator';
import {OperatorType} from '../../enums';
import {Serializable} from '../../Serializable';

export class OpIsNot extends CompOperator {

    _operatorType = OperatorType.isNot;
    _symbol = 'is not';

    constructor(left: string | Serializable, right?: any) {
        super(left, right);
    }

}
