import {Serializable} from '../Serializable';
import {SerializationType} from '../enums';
import {SerializeContext} from '../SerializeContext';

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
        return ctx.serialize(this._type, undefined,
            () => this.__defaultSerialize(ctx, undefined));
    }

    // noinspection JSUnusedLocalSymbols
    protected __defaultSerialize(
        /* eslint-disable-next-line */
        ctx: SerializeContext, o: any): string {
        return 'count(*)';
    }

}
