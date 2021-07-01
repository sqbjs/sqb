import {EventEmitter} from 'events';
import merge from 'putil-merge';
import flattenText from 'putil-flattentext';
import {Serializable} from '../Serializable';
import {SerializeContext, GenerateOptions, GeneratedQuery} from '../types';

export declare interface Query extends EventEmitter {
}

export abstract class Query extends Serializable {

    protected _values?: Record<string, any>;

    constructor() {
        super();
        EventEmitter.call(this);
    }

    /**
     * Generates Sql script
     */
    generate(options?: GenerateOptions): GeneratedQuery {
        const ctx: SerializeContext = {...options};
        if (this._values)
            ctx.values = {...ctx.values, ...this._values};
        ctx.serializeHooks = this.listeners('serialize');

        /* generate output */
        const sql = this._serialize(ctx);
        return {
            sql: flattenText(sql, {noWrap: !ctx.prettyPrint}),
            values: ctx.queryParams,
            returningFields: ctx.returningFields
        }
    }

    values(obj: any): this {
        if (typeof obj !== 'object' || Array.isArray(obj))
            throw new TypeError('Invalid argument');
        this._values = obj;
        return this;
    }

}

merge(Query.prototype, EventEmitter.prototype, {descriptor: true});
