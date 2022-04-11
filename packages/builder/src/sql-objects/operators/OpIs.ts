import {OperatorType} from '../../enums';
import {Serializable} from '../../Serializable';
import {CompOperator} from './CompOperator';

export class OpIs extends CompOperator {

    _operatorType = OperatorType.is;
    _symbol = 'is';

    constructor(left: string | Serializable, right?: any) {
        super(left, right);
    }

}
