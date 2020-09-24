import {OperatorType, SerializationType} from '../../enums';
import {SelectQuery} from '../../query/SelectQuery';
import {CompOperator} from './CompOperator';
import {SerializeContext} from '../../interfaces';

export class OpExists extends CompOperator {

    _operatorType = OperatorType.exists;
    _symbol = 'exists';

    constructor(query: SelectQuery) {
        super(query);
        if (!(typeof query === 'object' && query._type === SerializationType.SELECT_QUERY))
            throw new TypeError('You must provide a SelectQuery in `exists()`');
    }

    protected __defaultSerialize(ctx: SerializeContext, o) {
        return o.expression ? o.symbol + ' ' + o.expression : '';
    }

}
