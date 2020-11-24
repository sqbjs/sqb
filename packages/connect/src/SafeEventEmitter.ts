import {EventEmitter} from 'events';

export class SafeEventEmitter extends EventEmitter {

    emit(event: string | symbol, ...args: any[]): boolean {
        try {
            if (event === 'error' && !this.listenerCount('error'))
                return false;
            return super.emit(event, ...args);
        } catch (ignored) {
            return false;
        }
    }

    async emitAsync(event: string | symbol, ...args: any[]): Promise<boolean> {
        const listeners = this.listeners(event);
        for (const fn of listeners) {
            if (!(await fn(...args)))
                return false;
        }
        return true;
    }

}
