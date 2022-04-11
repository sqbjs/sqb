import {DataType} from '../enums';
import {Serializable} from '../Serializable';

export abstract class Expression extends Serializable {

    _dataType?: DataType;
    _isArray?: boolean;
    _isDataSet?: boolean;

}
