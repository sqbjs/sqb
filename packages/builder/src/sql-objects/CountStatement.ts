import {Serializable, serializeFallback} from '../Serializable';
import {SerializationType} from '../enums';
import {SerializeContext} from '../types';

export class CountStatement extends Serializable {
    _alias?: string;

    get _type(): SerializationType {
        return SerializationType.COUNT_STATEMENT;
    }

    /**
     * Sets alias to case expression.
     */
    as(alias: string): this {
        this._alias = alias;
        return this;
    }

    /**
     * Performs serialization
     *
     * @param {Object} ctx
     * @return {string}
     * @override
     */
    _serialize(ctx: SerializeContext): string {
        return serializeFallback(ctx, this._type, undefined,
            () => this.__defaultSerialize(ctx, undefined));
    }

    protected __defaultSerialize(ctx: SerializeContext, o: any): string {
        return 'count(*)';
    }

}
