import {Serializable} from '../Serializable';

export abstract class Column extends Serializable {

    _field = '';
    _schema?: string;
    _table?: string;
    _descending?: boolean;

}
