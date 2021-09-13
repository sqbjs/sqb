import {OperatorType} from '../../enums';
import {OpILike} from './OpILike';

export class OpNotILike extends OpILike {

    _operatorType = OperatorType.notILike;
    _symbol = 'not ilike'

}
