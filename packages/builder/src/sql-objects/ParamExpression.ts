import {Serializable, serializeFallback} from '../Serializable';
import {DataType, SerializationType} from '../enums';
import {SerializeContext} from '../types';

export class ParamExpression extends Serializable {

    constructor(public _name: string, public _dataType?: DataType) {
        super();
    }

    get _type(): SerializationType {
        return SerializationType.EXTERNAL_PARAMETER;
    }

    /**
     * Performs serialization
     */
    _serialize(ctx: SerializeContext): string {
        const o = {
            name: this._name,
            dataType: this._dataType
        };
        return serializeFallback(ctx, this._type, o,
            () => this.__defaultSerialize(ctx, o));
    }

    protected __defaultSerialize(ctx: SerializeContext,
                                 o: { name: string, dataType?: DataType }): string {
        const prmValue = ctx.values && ctx.values[o.name];
        ctx.queryParams = ctx.queryParams || {};
        ctx.queryParams[o.name] = prmValue;
        return ':' + o.name;
    }

}
