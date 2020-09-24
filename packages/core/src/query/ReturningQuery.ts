import {Query} from './Query';
import {ReturningData, SerializeContext} from '../interfaces';
import {isReservedWord, printArray, serializeFallback} from '../Serializable';

const RETURNING_COLUMN_PATTERN = /^((?:[a-zA-Z]\w*\.){0,2}) *([a-zA-Z]\w*) *(?:as)? *(\w+)?$/;

export abstract class ReturningQuery extends Query {

    _returning?: ReturningData[];

    /**
     *
     */
    returning(values: Record<string, string>): this {
        if (values) {
            const arr: ReturningData[] = [];
            if (typeof values !== 'object')
                throw new TypeError('Object argument required');
            for (const n of Object.getOwnPropertyNames(values)) {
                if (['string', 'number', 'date', 'blob', 'clob']
                    .indexOf(values[n]) < 0)
                    throw new TypeError(`Unknown data type "${values[n]}"`);
                const m = n.match(RETURNING_COLUMN_PATTERN);
                if (!m)
                    throw new TypeError(`(${n}) does not match column format`);
                const o: ReturningData = {field: m[2], dataType: values[n]};
                o.field = m[2];
                if (m[1]) {
                    const a = m[1].split(/\./g);
                    a.pop();
                    o.table = a.pop();
                    o.schema = a.pop();
                }
                if (m[3])
                    o.alias = m[3];
                arr.push(o);
            }
            this._returning = arr;
        } else
            this._returning = undefined;
        return this;
    }

    /**
     *
     */
    protected __serializeReturning(ctx: SerializeContext): string {
        if (!this._returning)
            return '';

        const arr: any[] = [];
        for (const t of this._returning) {
            const o: any = Object.assign({}, t);
            o.isReservedWord = isReservedWord(ctx, t.field);
            arr.push(o);
        }
        return serializeFallback(ctx, this._type + '.returning', arr, () => {
            const a: string[] = [];
            for (const o of arr) {
                a.push((o.schema ? o.schema + '.' : '') +
                    (o.table ? o.table + '.' : '') +
                    (o.isReservedWord ? '"' + o.field + '"' : o.field) +
                    (o.alias ? ' ' + o.alias : ''));
            }
            return printArray(a);
        });
    }

}
