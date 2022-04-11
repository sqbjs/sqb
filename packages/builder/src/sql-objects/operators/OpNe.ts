import {OperatorType} from '../../enums';
import {Serializable} from '../../Serializable';
import {CompOperator} from './CompOperator';

export class OpNe extends CompOperator {

    _operatorType = OperatorType.ne;
    _symbol = '!=';

    constructor(left: string | Serializable, right?: any) {
        super(left, right);
    }

}
