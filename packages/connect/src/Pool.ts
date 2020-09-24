
import _debug from 'debug';
import {Pool as LPool} from 'lightning-pool';
import {PluginRegistry} from '../../core/src/Plugins';

const debugOut = _debug('sqb:pool');

export namespace Pool {
    export interface Configuration {
        dialect: string;
        user: string;
        schema?: string;
        pool?: {
            acquireMaxRetries: number;
            /**
             * default: 2000
             */
            acquireRetryWait: number;
            acquireTimeoutMillis: number;
            /**
             * default: 30000
             */
            idleTimeoutMillis: number;
            /**
             * default: 10
             */
            max: number;
            /**
             * default: 1000
             */
            maxQueue: number;
            min: number;
            minIdle: number;
            validation: boolean;
        }
        defaults?: {
            autoCommit?: boolean;
            cursor?: boolean;
            objectRows?: boolean;
            naming?: boolean;
        }
    }
}

export class Pool extends LPool {

    constructor(config: string | Pool.Configuration) {
        if (!(config && typeof config === 'object'))
            throw new TypeError('Pool configuration object required');
        const adapter = PluginRegistry.createAdapter(config);
        if (!adapter)
            throw new Error(`No connection adapter registered for dialect "${config.dialect}"`);
        config.defaults = config.defaults || {};
        const cfg = Object.assign({}, config);
        delete cfg.pool;
        /* istanbul ignore else */
        if (adapter.paramType !== undefined)
            cfg.paramType = adapter.paramType;

        const factory = {
            create: () => adapter.createConnection(),
            destroy: (client) => {
                return client.close().then(() => {
                    if (client.connection)
                        client.connection.emitSafe('close');
                });
            },
            reset: (client) => client.rollback,
            validate: (client) => {
                return client.test();
            }
        };
        const poolOptions = config.pool || {};
        poolOptions.resetOnReturn = true;
        super(factory, poolOptions);
        this.config = cfg;
    }

}
