import {CompOperator} from './CompOperator';
import {OperatorType} from '../../enums';
import {Serializable} from '../../Serializable';

export class OpLte extends CompOperator {

    _operatorType = OperatorType.lte;
    _symbol = '<=';

    constructor(left: string | Serializable, right?: any) {
        super(left, right);
    }

}
