import {Serializable} from '../Serializable';

export abstract class Column extends Serializable {

    _field?: string;
    _schema?: string;
    _table?: string;
    _descending?: boolean;

}
