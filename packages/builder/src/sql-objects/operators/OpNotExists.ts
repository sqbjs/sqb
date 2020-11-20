import {OperatorType} from '../../enums';
import {OpExists} from './OpExists';

export class OpNotExists extends OpExists {

    _operatorType = OperatorType.notExists;
    _symbol = 'not exists';

}
