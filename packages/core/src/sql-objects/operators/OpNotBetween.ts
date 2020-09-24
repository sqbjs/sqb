import {Serializable} from '../../Serializable';
import {OperatorType} from '../../enums';
import {OpBetween} from './OpBetween';

export class OpNotBetween extends OpBetween {

    _operatorType = OperatorType.notBetween;
    _symbol = 'not between';

    constructor(expression: string | Serializable, values: any[]) {
        super(expression, values);
    }

}
