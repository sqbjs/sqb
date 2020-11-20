import {CompOperator} from './CompOperator';
import {OperatorType} from '../../enums';
import {Serializable} from '../../Serializable';

export class OpIs extends CompOperator {

    _operatorType = OperatorType.is;
    _symbol = 'is';

    constructor(expression: string | Serializable, value?: any) {
        super(expression, value);
    }

}
