import {EventEmitter} from 'events';
import merge from 'putil-merge';
import flattenText from 'putil-flattentext';
import {Serializable} from '../Serializable';
import {ParamType} from '../enums';
import {SerializeContext} from '../interfaces';
import {PluginRegistry} from '../Plugins';

export namespace Query {
    export interface GenerateOptions {
        /**
         * default = true
         */
        prettyPrint?: boolean;
        paramType?: ParamType;
        values?: any[] | Record<string, any>;
    }
}

export declare interface Query extends EventEmitter {
}

export abstract class Query extends Serializable {

    protected _values?: Record<string, any>;
    protected _action?: string;

    // todo protected _dbobj: any;

    constructor() {
        super();
        EventEmitter.call(this);
    }

    /**
     * Returns Pool instance
     * /
     get pool() {
        return this._dbobj && this._dbobj.pool ?
            this._dbobj.pool : this._dbobj;
    }*/

    /**
     *
     * @param {Object} [options]
     * @return {Promise}
     * @public
     * /
     execute(options) {
        if (!this._dbobj)
            throw new Error('This query is not executable');
        return this._dbobj.execute(this, options);
    }*/

    /**
     *
     */
    generate(options?: Query.GenerateOptions): { sql: string, values?: any } {
        const ctx: SerializeContext = {query: {sql: null}};
        /* const pool = null;// this.pool;
        if ((mergePoolConfig || mergePoolConfig == null) &&
            pool && pool.config.defaults)
            merge(ctx, pool.config.defaults, {deep: true});*/
        if (options)
            merge(ctx, options, {deep: true});
        ctx.values = ctx.values ||
            (this._values ? merge({}, this._values) : {});
        /* create serialization extension */
        ctx.plugin = PluginRegistry.createSerializer(ctx);
        /* prettyPrint default true */
        ctx.prettyPrint = ctx.prettyPrint || ctx.prettyPrint == null;
        /* paramType default COLON */
        ctx.paramType = ctx.paramType != null ? ctx.paramType :
            (ctx.plugin?.paramType != null ? ctx.plugin.paramType : ParamType.COLON);
        ctx.query.values = ctx.query.values ||
            (ctx.paramType === ParamType.QUESTION_MARK ||
            ctx.paramType === ParamType.DOLLAR ? [] : {});
        ctx.serializeHooks = this.listeners('serialize');
        /* generate output */
        const sql = this._serialize(ctx);
        ctx.query.sql = flattenText(sql, {noWrap: !ctx.prettyPrint});
        return ctx.query;
    }

    values(obj: any): this {
        if (typeof obj !== 'object' || Array.isArray(obj))
            throw new TypeError('Invalid argument');
        this._values = obj;
        return this;
    }

}

merge(Query.prototype, EventEmitter.prototype, {descriptor: true});
