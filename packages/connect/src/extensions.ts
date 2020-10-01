import {Adapter} from './Adapter';

export const adapters: Record<string, Adapter> = {};

export function registerAdapter(driver: string, adapter: Adapter): void {
    if (!driver)
        throw new TypeError('A DatabaseAdapter must contain "driver" property');
    if (!adapter.dialect)
        throw new TypeError('A DatabaseAdapter must contain "dialect" property');
    adapters[driver] = adapter;
}

export function unRegisterAdapter(...driver: string[]) {
    for (const x of driver) {
        delete adapters[x];
    }
}
