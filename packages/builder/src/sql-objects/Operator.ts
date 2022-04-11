import {OperatorType} from '../enums';
import {Serializable} from '../Serializable';

export abstract class Operator extends Serializable {

    abstract _operatorType: OperatorType;

}
