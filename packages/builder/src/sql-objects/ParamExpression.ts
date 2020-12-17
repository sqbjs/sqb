import {Serializable, serializeFallback} from '../Serializable';
import {SerializationType} from '../enums';
import {SerializeContext} from '../types';

export class ParamExpression extends Serializable {

    constructor(public _name: string) {
        super();
    }

    get _type(): SerializationType {
        return SerializationType.EXTERNAL_PARAMETER;
    }

    /**
     * Performs serialization
     */
    _serialize(ctx: SerializeContext): string {
        return serializeFallback(ctx, this._type, this._name,
            () => this.__defaultSerialize(ctx, this._name));
    }

    protected __defaultSerialize(ctx: SerializeContext, name: string): string {
        const prmValue = ctx.values && ctx.values[name];
        ctx.queryParams = ctx.queryParams || {};
        ctx.queryParams[name] = prmValue;
        return ':' + name;
    }

}
