import {OperatorType} from '../../enums';
import {OpLike} from './OpLike';

export class OpILike extends OpLike {

    _operatorType = OperatorType.iLike;
    _symbol = 'ilike';

}
