import {FieldInfo} from './types';

export class FieldInfoMap {
    private _obj!: Record<string, FieldInfo>;
    private _arr!: FieldInfo[];

    constructor() {
        Object.defineProperty(this, '_obj', {
            enumerable: false,
            configurable: false,
            writable: false,
            value: {}
        });
        Object.defineProperty(this, '_arr', {
            enumerable: false,
            configurable: false,
            writable: false,
            value: []
        });
    }

    add(field: FieldInfo) {
        const idx = field.index != null ? field.index : this._arr.length;
        this._arr[idx] = field;
        field.index = idx;
        this._obj = this._arr.reduce((a, f) => {
            a[f.name.toUpperCase()] = f;
            return a;
        }, {});
    }

    get(k: string | number): FieldInfo {
        if (typeof k === 'number')
            return this._arr[k];
        return this._obj[k.toUpperCase()];
    }

    entries(): [string, FieldInfo][] {
        return Object.entries(this._obj);
    }

    keys(): string[] {
        return Object.keys(this._obj);
    }

    values(): FieldInfo[] {
        return [...this._arr];
    }

}
