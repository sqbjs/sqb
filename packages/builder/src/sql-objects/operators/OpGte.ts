import {OperatorType} from '../../enums';
import {Serializable} from '../../Serializable';
import {CompOperator} from './CompOperator';

export class OpGte extends CompOperator {

    _operatorType = OperatorType.gte;
    _symbol = '>=';

    constructor(left: string | Serializable, right?: any) {
        super(left, right);
    }

}
