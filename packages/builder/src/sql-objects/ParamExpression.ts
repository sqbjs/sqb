import {Serializable, serializeFallback} from '../Serializable';
import {DataType, SerializationType} from '../enums';
import {SerializeContext} from '../types';

export class ParamExpression extends Serializable {
    _name: string;
    _dataType?: DataType
    _isArray?: boolean;

    constructor(arg: string | { name: string, dataType?: DataType, isArray?: boolean }) {
        super();
        if (typeof arg === 'object') {
            this._name = arg.name;
            this._dataType = arg.dataType;
            this._isArray = arg.isArray;
        } else this._name = arg;
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
            dataType: this._dataType,
            isArray: this._isArray,
        };
        return serializeFallback(ctx, this._type, o,
            () => this.__defaultSerialize(ctx, o));
    }

    protected __defaultSerialize(ctx: SerializeContext,
                                 o: {
                                     name: string,
                                     dataType?: DataType,
                                     isArray?: boolean
                                 }): string {
        let prmValue = ctx.params && ctx.params[o.name];
        if (o.isArray && !Array.isArray(prmValue))
            prmValue = [prmValue];
        ctx.queryParams = ctx.queryParams || {};
        if (prmValue !== undefined)
            ctx.queryParams[o.name] = prmValue;
        return ':' + o.name;
    }

}
