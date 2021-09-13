import {OpIn} from './OpIn';
import {OperatorType} from '../../enums';

export class OpNotIn extends OpIn {

    _operatorType = OperatorType.notIn;
    _symbol = 'not in'

}
