import {OpLike} from './OpLike';
import {OperatorType} from '../../enums';

export class OpNotLike extends OpLike {

    _operatorType = OperatorType.notLike;
    _symbol = 'not like'

}
