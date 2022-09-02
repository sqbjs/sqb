import {Adapter} from './adapter.js';

export let adapters: Adapter[] = [];

export function registerAdapter(adapter: Adapter): void {
    if (!adapter.driver)
        throw new TypeError('A DatabaseAdapter must contain "driver" property');
    adapters.push(adapter);
}

export function unRegisterAdapter(...adapter: Adapter[]) {
    adapters = adapters.filter(x => !adapter.includes(x));
}
