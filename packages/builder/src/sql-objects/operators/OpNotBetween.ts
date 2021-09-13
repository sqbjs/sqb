import {OperatorType} from '../../enums';
import {OpBetween} from './OpBetween';

export class OpNotBetween extends OpBetween {

    _operatorType = OperatorType.notBetween;
    _symbol = 'not between';


}
