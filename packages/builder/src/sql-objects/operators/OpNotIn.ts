import {OperatorType} from '../../enums';
import {OpIn} from './OpIn';

export class OpNotIn extends OpIn {

    _operatorType = OperatorType.notIn;
    _symbol = 'not in'

}
