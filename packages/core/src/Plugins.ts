import {Plugin} from './interfaces';

export namespace PluginRegistry {

    export const items: Plugin[] = [];

    export function register(extension: Plugin): void {
        /* istanbul ignore else */
        if (typeof extension === 'object' && !items.includes(extension))
            items.push(extension);
    }

    export function createSerializer(ctx) {
        for (const plugin of items) {
            if (typeof plugin.createSerializer === 'function') {
                const result = plugin.createSerializer(ctx);
                /* istanbul ignore else */
                if (result)
                    return result;
            }
        }
    }

    export function createAdapter(config: any): any {
        for (const extension of items) {
            if (typeof extension.createAdapter === 'function') {
                const result = extension.createAdapter(config);
                /* istanbul ignore else */
                if (result)
                    return result;
            }
        }
    }

    export function createMetaOperator(config) {
        for (const extension of items) {
            if (typeof extension.createMetaOperator === 'function') {
                const result = extension.createMetaOperator(config);
                /* istanbul ignore else */
                if (result)
                    return result;
            }
        }
    }

    export const stringify = function () {
        for (const extension of items) {
            if (typeof extension.stringify === 'function')
                return extension.stringify;
        }
    }

}
