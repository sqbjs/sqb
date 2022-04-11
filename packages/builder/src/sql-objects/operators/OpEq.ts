import {OperatorType} from '../../enums';
import {Serializable} from '../../Serializable';
import {CompOperator} from './CompOperator';

export class OpEq extends CompOperator {

    _operatorType = OperatorType.eq;
    _symbol = '='

    constructor(left: string | Serializable, right: any) {
        super(left, right);
    }

}
