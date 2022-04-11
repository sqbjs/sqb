import {OperatorType} from '../../enums';
import {Serializable} from '../../Serializable';
import {CompOperator} from './CompOperator';

export class OpLte extends CompOperator {

    _operatorType = OperatorType.lte;
    _symbol = '<=';

    constructor(left: string | Serializable, right?: any) {
        super(left, right);
    }

}
