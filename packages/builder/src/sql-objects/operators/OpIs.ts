import {CompOperator} from './CompOperator';
import {OperatorType} from '../../enums';
import {Serializable} from '../../Serializable';

export class OpIs extends CompOperator {

    _operatorType = OperatorType.is;
    _symbol = 'is';

    constructor(left: string | Serializable, right?: any) {
        super(left, right);
    }

}
