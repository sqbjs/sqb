import {CompOperator} from './CompOperator';
import {OperatorType} from '../../enums';
import {Serializable} from '../../Serializable';

export class OpGt extends CompOperator {

    _operatorType = OperatorType.gt;
    _symbol = '>';

    constructor(expression: string | Serializable, value?: any) {
        super(expression, value);
    }

}
