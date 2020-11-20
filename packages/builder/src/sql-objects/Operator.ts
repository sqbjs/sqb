import {Serializable} from '../Serializable';
import {OperatorType} from '../enums';

export abstract class Operator extends Serializable {

    abstract _operatorType: OperatorType;

}
