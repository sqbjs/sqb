import {CompOperator} from './CompOperator';
import {Serializable} from '../../Serializable';
import {OperatorType} from '../../enums';

export class OpEq extends CompOperator {

    _operatorType = OperatorType.eq;
    _symbol = '='

    constructor(left: string | Serializable, right: any) {
        super(left, right);
    }

}
