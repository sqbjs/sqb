import {Serializable} from '../Serializable';
import {DataType} from '../enums';

export abstract class Expression extends Serializable {

    _dataType?: DataType;
    _isArray?: boolean;
    _isDataSet?: boolean;

}
