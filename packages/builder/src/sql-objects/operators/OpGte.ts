import {CompOperator} from './CompOperator';
import {OperatorType} from '../../enums';
import {Serializable} from '../../Serializable';

export class OpGte extends CompOperator {

    _operatorType = OperatorType.gte;
    _symbol = '>=';

    constructor(left: string | Serializable, right?: any) {
        super(left, right);
    }

}
