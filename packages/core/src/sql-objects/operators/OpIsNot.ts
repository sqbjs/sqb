import {CompOperator} from './CompOperator';
import {OperatorType} from '../../enums';
import {Serializable} from '../../Serializable';

export class OpIsNot extends CompOperator {

    _operatorType = OperatorType.isNot;
    _symbol = 'is not';

    constructor(expression: string | Serializable, value?: any) {
        super(expression, value);
    }

}
