import {OperatorType} from '../../enums';
import {OpLike} from './OpLike';

export class OpNotLike extends OpLike {

    _operatorType = OperatorType.notLike;
    _symbol = 'not like'

}
