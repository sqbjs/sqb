import {CompOperator} from './CompOperator';
import {Serializable} from '../../Serializable';
import {OperatorType} from '../../enums';

export class OpEq extends CompOperator {

    _operatorType = OperatorType.eq;
    _symbol = '='

    constructor(expression: string | Serializable, value: any) {
        super(expression, value);
    }

}
