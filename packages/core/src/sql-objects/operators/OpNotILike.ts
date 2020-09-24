import {OpLike} from './OpLike';
import {OperatorType} from '../../enums';

export class OpNotILike extends OpLike {

    _operatorType = OperatorType.notILike;
    _symbol = 'not ilike';

}
