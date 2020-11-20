import {CompOperator} from './CompOperator';
import {OperatorType} from '../../enums';
import {Serializable} from '../../Serializable';

export class OpLt extends CompOperator {

    _operatorType = OperatorType.lt;
    _symbol = '<';

    constructor(expression: string | Serializable, value?: any) {
        super(expression, value);
    }

}
