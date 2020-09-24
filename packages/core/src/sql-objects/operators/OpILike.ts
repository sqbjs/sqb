import {OpLike} from './OpLike';
import {OperatorType} from '../../enums';

export class OpILike extends OpLike {

    _operatorType = OperatorType.iLike;
    _symbol = 'ilike';

}
