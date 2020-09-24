import {CompOperator} from './CompOperator';
import {OperatorType} from '../../enums';
import {Serializable} from '../../Serializable';

export class OpNe extends CompOperator {

    _operatorType = OperatorType.ne;
    _symbol = '!=';

    constructor(expression: string | Serializable, value?: any) {
        super(expression, value);
    }

}
